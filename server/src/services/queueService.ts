import { prisma } from '../prisma';
import { congestionService } from './congestionService';
import { notificationService } from './notificationService';
import { auditService } from './auditService';
import { QueueStatus } from '../types';

export const queueService = {
  async checkInFarmer(identifier: string, actorName = 'Self/Kiosk') {
    // Find booking by tokenId or farmerId (active for today)
    const todayStr = new Date().toISOString().split('T')[0];
    const startOfDay = new Date(`${todayStr}T00:00:00.000Z`);
    const endOfDay = new Date(`${todayStr}T23:59:59.999Z`);

    const booking = await prisma.booking.findFirst({
      where: {
        OR: [
          { tokenId: identifier.trim() },
          {
            farmerId: identifier.trim(),
            scheduledDateTime: { gte: startOfDay, lte: endOfDay },
          },
        ],
        tokenStatus: { in: ['ACTIVE', 'EXTENDED'] },
      },
      include: {
        farmer: true,
        centre: true,
        queueEntry: true,
      },
    });

    if (!booking) {
      throw new Error(`No active appointment found today for identifier "${identifier}". Check token ID or date.`);
    }

    if (booking.queueStatus !== QueueStatus.SCHEDULED && booking.queueStatus !== QueueStatus.APPROACHING) {
      if (booking.queueStatus === QueueStatus.WAITING || booking.queueStatus === QueueStatus.CHECKED_IN) {
        return { booking, message: 'Farmer is already checked-in and waiting in queue.' };
      }
      throw new Error(`Cannot check in. Current status is ${booking.queueStatus}.`);
    }

    const checkInTime = new Date();

    // Update Booking & QueueEntry in a transaction
    const updated = await prisma.$transaction(async (tx) => {
      const b = await tx.booking.update({
        where: { id: booking.id },
        data: {
          checkInTime,
          queueStatus: QueueStatus.WAITING,
        },
      });

      const q = await tx.queueEntry.update({
        where: { bookingId: booking.id },
        data: {
          status: QueueStatus.WAITING,
          arrivalTime: checkInTime,
        },
      });

      return { booking: b, queueEntry: q };
    });

    // Notify farmer
    await notificationService.createNotification({
      recipientId: booking.farmerId,
      category: 'QUEUE',
      title: 'Arrival Checked-In Successfully',
      message: `You have successfully checked in at ${booking.centre.name}. Your queue position is #${booking.queueNumber}. Please proceed to the waiting area.`,
      actionUrl: `/farmer/token/${booking.tokenId}`,
      preferredLanguage: booking.farmer.preferredLanguage,
    });

    // Audit log
    await auditService.log({
      actor: actorName,
      actorRole: 'FARMER/OPERATOR',
      action: 'SMART_CHECK_IN',
      entityType: 'Booking',
      entityId: booking.id,
      oldValue: { queueStatus: booking.queueStatus },
      newValue: { queueStatus: QueueStatus.WAITING, checkInTime },
      reason: 'Physical/Smart arrival check-in confirmed',
    });

    const congestion = await congestionService.calculateCentreCongestion(booking.centreId);

    return {
      booking: updated.booking,
      queueEntry: updated.queueEntry,
      congestion,
      message: 'Check-in successful. Farmer added to active waiting queue.',
    };
  },

  async callNextToken(centreId: string, counterNumber: number, operatorName: string) {
    const todayStr = new Date().toISOString().split('T')[0];

    // Find next waiting queue entry
    const nextInQueue = await prisma.queueEntry.findFirst({
      where: {
        centreId,
        serviceDate: todayStr,
        status: QueueStatus.WAITING,
      },
      orderBy: [
        { priority: 'desc' },
        { queueNumber: 'asc' },
      ],
      include: {
        booking: {
          include: { farmer: true },
        },
      },
    });

    if (!nextInQueue) {
      return { token: null, message: 'No farmers currently waiting in queue for this centre.' };
    }

    const now = new Date();

    // Transition to CALLED
    const result = await prisma.$transaction(async (tx) => {
      const q = await tx.queueEntry.update({
        where: { id: nextInQueue.id },
        data: {
          status: QueueStatus.CALLED,
          counterNumber,
          actualCallTime: now,
        },
      });

      const b = await tx.booking.update({
        where: { id: nextInQueue.bookingId },
        data: {
          queueStatus: QueueStatus.CALLED,
        },
      });

      return { queueEntry: q, booking: b };
    });

    // Notify the farmer
    await notificationService.createNotification({
      recipientId: nextInQueue.booking.farmerId,
      category: 'QUEUE',
      title: `Token #${nextInQueue.tokenId} Called!`,
      message: `Please proceed immediately to Counter #${counterNumber} with your crop sample for Quality & Assay verification.`,
      actionUrl: `/farmer/token/${nextInQueue.tokenId}`,
      preferredLanguage: nextInQueue.booking.farmer.preferredLanguage,
    });

    await auditService.log({
      actor: operatorName,
      actorRole: 'CENTRE_OPERATOR',
      action: 'CALL_NEXT_TOKEN',
      entityType: 'QueueEntry',
      entityId: nextInQueue.id,
      newValue: { status: QueueStatus.CALLED, counterNumber },
      reason: `Operator called next token to counter #${counterNumber}`,
    });

    return {
      token: result.booking,
      queueEntry: result.queueEntry,
      farmer: nextInQueue.booking.farmer,
      counterNumber,
    };
  },

  async getLiveQueueBoard(centreId: string) {
    const todayStr = new Date().toISOString().split('T')[0];

    const centre = await prisma.procurementCentre.findUnique({
      where: { id: centreId },
    });

    if (!centre) {
      throw new Error(`Centre ${centreId} not found`);
    }

    const [calledTokens, waitingTokens, completedToday, congestion] = await Promise.all([
      prisma.queueEntry.findMany({
        where: {
          centreId,
          serviceDate: todayStr,
          status: { in: [QueueStatus.CALLED, QueueStatus.PROCESSING] },
        },
        include: {
          booking: {
            include: { farmer: true },
          },
        },
        orderBy: { actualCallTime: 'desc' },
      }),
      prisma.queueEntry.findMany({
        where: {
          centreId,
          serviceDate: todayStr,
          status: QueueStatus.WAITING,
        },
        include: {
          booking: {
            include: { farmer: true },
          },
        },
        orderBy: [
          { priority: 'desc' },
          { queueNumber: 'asc' },
        ],
        take: 10,
      }),
      prisma.queueEntry.count({
        where: {
          centreId,
          serviceDate: todayStr,
          status: QueueStatus.COMPLETED,
        },
      }),
      congestionService.calculateCentreCongestion(centreId, todayStr),
    ]);

    return {
      centre: {
        id: centre.id,
        name: centre.name,
        code: centre.centreCode,
        activeCounters: centre.activeCounters,
        status: centre.operationalStatus,
      },
      nowServing: calledTokens.map((q) => ({
        queueNumber: q.queueNumber,
        tokenId: q.tokenId,
        counterNumber: q.counterNumber,
        farmerName: q.booking.farmer.fullName,
        crop: q.booking.crop,
        quantity: q.booking.allocatedQuantity,
        calledAt: q.actualCallTime,
      })),
      nextInLine: waitingTokens.map((q) => ({
        queueNumber: q.queueNumber,
        tokenId: q.tokenId,
        farmerName: q.booking.farmer.fullName,
        crop: q.booking.crop,
        quantity: q.booking.allocatedQuantity,
        arrivalTime: q.arrivalTime,
      })),
      waitingCount: congestion.waitingFarmersCount,
      completedToday,
      congestion,
    };
  },
};
