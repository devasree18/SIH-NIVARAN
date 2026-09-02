import { prisma } from '../prisma';
import { congestionService } from './congestionService';
import { notificationService } from './notificationService';
import { auditService } from './auditService';
import { TokenStatus, QueueStatus } from '../types';

export interface BookSlotRequest {
  farmerId: string;
  centreId: string;
  crop: string;
  requestedQuantity: number;
  preferredDate: string; // YYYY-MM-DD
  slotId?: string; // Optional: user may pick specific slot or let smart allocation choose best
  idempotencyKey?: string;
  actor?: string;
}

export const slotAllocationService = {
  async bookSlot(params: BookSlotRequest) {
    const { farmerId, centreId, crop, requestedQuantity, preferredDate, slotId, idempotencyKey, actor } = params;

    if (requestedQuantity <= 0) {
      throw new Error('Requested quantity must be greater than zero');
    }

    // 1. Idempotency Check
    if (idempotencyKey) {
      const existing = await prisma.booking.findUnique({
        where: { idempotencyKey },
        include: {
          centre: true,
          slot: true,
          queueEntry: true,
        },
      });
      if (existing) {
        return { booking: existing, isDuplicate: true };
      }
    }

    // 2. Validate Farmer
    const farmer = await prisma.farmer.findUnique({
      where: { farmerId },
    });
    if (!farmer || !farmer.isActive) {
      throw new Error('Farmer is not registered or currently inactive');
    }

    // 3. Prevent duplicate active booking for the same farmer on the same day
    const startOfDay = new Date(`${preferredDate}T00:00:00.000Z`);
    const endOfDay = new Date(`${preferredDate}T23:59:59.999Z`);

    const existingDailyBooking = await prisma.booking.findFirst({
      where: {
        farmerId,
        scheduledDateTime: {
          gte: startOfDay,
          lte: endOfDay,
        },
        tokenStatus: { in: [TokenStatus.ACTIVE, TokenStatus.EXTENDED] },
        queueStatus: { notIn: ['COMPLETED', 'CANCELLED'] },
      },
    });

    if (existingDailyBooking) {
      throw new Error(`Farmer already has an active booking (Token #${existingDailyBooking.tokenId}) on ${preferredDate}`);
    }

    // 4. Validate Centre & Operational Status
    const centre = await prisma.procurementCentre.findUnique({
      where: { id: centreId },
    });
    if (!centre) {
      throw new Error('Procurement centre not found');
    }
    if (centre.operationalStatus === 'CLOSED') {
      throw new Error(`Procurement centre is closed on ${preferredDate}`);
    }
    if (centre.operationalStatus === 'PAUSED') {
      throw new Error('Procurement centre is currently paused due to emergency or maintenance');
    }

    // 5. Select or Validate Target Slot
    let targetSlotId = slotId;

    if (!targetSlotId) {
      // Smart Auto-Allocation: Find slots with adequate available quantity, order by least booked
      const eligibleSlots = await prisma.slot.findMany({
        where: {
          centreId,
          date: preferredDate,
          availableQuantity: { gte: requestedQuantity },
          slotStatus: 'AVAILABLE',
        },
        orderBy: [
          { bookedFarmerCount: 'asc' },
          { startTime: 'asc' },
        ],
      });

      if (eligibleSlots.length === 0) {
        throw new Error(`No available slot with remaining capacity for ${requestedQuantity} quintals on ${preferredDate}`);
      }
      targetSlotId = eligibleSlots[0].id;
    }

    // 6. Concurrency-Safe Transaction: Atomic decrement & reservation
    const bookingResult = await prisma.$transaction(async (tx) => {
      // Atomic reservation with conditional update (prevents race condition / over-allocation)
      const targetSlot = await tx.slot.findUnique({
        where: { id: targetSlotId },
      });

      if (!targetSlot) {
        throw new Error('Selected slot does not exist');
      }

      if (targetSlot.availableQuantity < requestedQuantity) {
        throw new Error(`Insufficient slot capacity. Requested: ${requestedQuantity} Qtl, Available: ${targetSlot.availableQuantity} Qtl.`);
      }

      // Decrement available capacity and increment reserved
      const updatedSlot = await tx.slot.update({
        where: {
          id: targetSlotId,
          version: targetSlot.version, // Optimistic concurrency check
        },
        data: {
          availableQuantity: targetSlot.availableQuantity - requestedQuantity,
          reservedQuantity: targetSlot.reservedQuantity + requestedQuantity,
          bookedFarmerCount: targetSlot.bookedFarmerCount + 1,
          version: { increment: 1 },
          slotStatus: targetSlot.availableQuantity - requestedQuantity <= 0 ? 'FULL' : 'AVAILABLE',
        },
      });

      // Calculate queue sequence for this centre and date
      const existingQueueCount = await tx.queueEntry.count({
        where: {
          centreId,
          serviceDate: preferredDate,
        },
      });
      const queueNumber = existingQueueCount + 1;

      // Generate identifiers
      const bookingId = `BKG-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
      const tokenId = `TKN-${centre.centreCode.replace(/[^A-Z0-9]/g, '')}-${preferredDate.replace(/-/g, '').slice(4)}-${String(queueNumber).padStart(3, '0')}`;

      // Calculate validity window
      const [startHour, startMin] = targetSlot.startTime.split(':').map(Number);
      const [endHour, endMin] = targetSlot.endTime.split(':').map(Number);
      const scheduledDateTime = new Date(`${preferredDate}T${targetSlot.startTime}:00`);
      const validityStart = new Date(`${preferredDate}T${targetSlot.startTime}:00`);
      // Standard grace period: 45 minutes beyond slot end
      const validityEnd = new Date(`${preferredDate}T${targetSlot.endTime}:00`);
      validityEnd.setMinutes(validityEnd.getMinutes() + 45);

      // Create Booking record
      const booking = await tx.booking.create({
        data: {
          bookingId,
          tokenId,
          farmerId,
          centreId,
          crop,
          requestedQuantity,
          allocatedQuantity: requestedQuantity,
          slotId: targetSlotId,
          scheduledDateTime,
          queueNumber,
          queueStatus: QueueStatus.SCHEDULED,
          tokenStatus: TokenStatus.ACTIVE,
          validityStart,
          validityEnd,
          idempotencyKey,
        },
      });

      // Create Queue Entry
      const queueEntry = await tx.queueEntry.create({
        data: {
          centreId,
          bookingId: booking.id,
          tokenId,
          serviceDate: preferredDate,
          queueNumber,
          status: QueueStatus.SCHEDULED,
          estimatedCallTime: scheduledDateTime,
        },
      });

      return { booking, queueEntry, updatedSlot };
    });

    // 7. Calculate Congestion for response
    const congestion = await congestionService.calculateCentreCongestion(centreId, preferredDate);

    // 8. Create in-app notification & dispatch
    await notificationService.createNotification({
      recipientId: farmerId,
      category: 'BOOKING',
      title: 'Slot & Token Confirmed',
      message: `Your procurement appointment for ${requestedQuantity} Qtl ${crop} at ${centre.name} is confirmed. Token: #${bookingResult.booking.tokenId}, Queue #${bookingResult.booking.queueNumber}. Date: ${preferredDate} at ${bookingResult.updatedSlot.startTime}.`,
      actionUrl: `/farmer/token/${bookingResult.booking.tokenId}`,
      preferredLanguage: farmer.preferredLanguage,
    });

    // 9. Audit log
    await auditService.log({
      actor: actor || farmer.fullName,
      actorRole: 'FARMER',
      action: 'SLOT_BOOKING',
      entityType: 'Booking',
      entityId: bookingResult.booking.id,
      newValue: {
        tokenId: bookingResult.booking.tokenId,
        crop,
        quantity: requestedQuantity,
        centreId,
        date: preferredDate,
      },
      reason: 'Farmer automated smart slot reservation',
    });

    return {
      booking: bookingResult.booking,
      queueEntry: bookingResult.queueEntry,
      slot: bookingResult.updatedSlot,
      congestion,
      isDuplicate: false,
    };
  },
};
