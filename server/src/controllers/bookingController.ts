import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { slotAllocationService } from '../services/slotAllocationService';
import { auditService } from '../services/auditService';
import { TokenStatus, QueueStatus } from '../types';

const bookSlotSchema = z.object({
  centreId: z.string().min(1, 'Centre ID is required'),
  crop: z.string().min(1, 'Crop name is required'),
  requestedQuantity: z.number().positive('Quantity must be greater than zero'),
  preferredDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format must be YYYY-MM-DD'),
  slotId: z.string().optional(),
  idempotencyKey: z.string().optional(),
});

export const bookingController = {
  async createBooking(req: Request, res: Response) {
    const data = bookSlotSchema.parse(req.body);

    const farmerId = req.user?.farmerId;
    if (!farmerId) {
      return sendError(res, 'Only registered farmers can book procurement appointments.', 403, 'FORBIDDEN');
    }

    try {
      const result = await slotAllocationService.bookSlot({
        farmerId,
        centreId: data.centreId,
        crop: data.crop,
        requestedQuantity: data.requestedQuantity,
        preferredDate: data.preferredDate,
        slotId: data.slotId,
        idempotencyKey: data.idempotencyKey,
        actor: req.user?.fullName,
      });

      return sendSuccess(res, result, result.isDuplicate ? 'Existing booking returned (idempotent)' : 'Slot booked successfully', 201);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to book slot', 400, 'BOOKING_FAILED');
    }
  },

  async getFarmerBookings(req: Request, res: Response) {
    const farmerId = req.user?.farmerId;
    if (!farmerId) {
      return sendError(res, 'Farmer identity required', 403);
    }

    const bookings = await prisma.booking.findMany({
      where: { farmerId },
      include: {
        centre: true,
        slot: true,
        queueEntry: true,
        qualityAssay: true,
        weighment: true,
        procurementRecord: {
          include: { payment: true },
        },
      },
      orderBy: { scheduledDateTime: 'desc' },
    });

    return sendSuccess(res, bookings);
  },

  async getTokenDetails(req: Request, res: Response) {
    const { tokenId } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { tokenId },
      include: {
        farmer: true,
        centre: true,
        slot: true,
        queueEntry: true,
        qualityAssay: true,
        weighment: true,
        quantityAdjustment: true,
        procurementRecord: {
          include: { payment: true },
        },
      },
    });

    if (!booking) {
      return sendError(res, `Token #${tokenId} not found`, 404, 'NOT_FOUND');
    }

    return sendSuccess(res, booking);
  },

  async cancelBooking(req: Request, res: Response) {
    const { tokenId } = req.params;
    const { reason = 'Cancelled by farmer' } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { tokenId },
      include: { slot: true },
    });

    if (!booking) {
      return sendError(res, 'Booking not found', 404);
    }

    if (booking.queueStatus !== QueueStatus.SCHEDULED && booking.queueStatus !== QueueStatus.APPROACHING) {
      return sendError(res, `Cannot cancel token in status ${booking.queueStatus}. Produce is already being processed.`, 400);
    }

    // Atomic transaction: cancel booking and restore slot capacity
    await prisma.$transaction(async (tx) => {
      await tx.booking.update({
        where: { id: booking.id },
        data: {
          tokenStatus: TokenStatus.CANCELLED,
          queueStatus: QueueStatus.COMPLETED,
        },
      });

      await tx.queueEntry.update({
        where: { bookingId: booking.id },
        data: {
          status: 'CANCELLED',
        },
      });

      await tx.slot.update({
        where: { id: booking.slotId },
        data: {
          availableQuantity: { increment: booking.allocatedQuantity },
          reservedQuantity: { decrement: booking.allocatedQuantity },
          bookedFarmerCount: { decrement: 1 },
          slotStatus: 'AVAILABLE',
        },
      });
    });

    await auditService.log({
      actor: req.user?.fullName || 'Farmer',
      actorRole: req.user?.role || 'FARMER',
      action: 'CANCEL_BOOKING',
      entityType: 'Booking',
      entityId: booking.id,
      oldValue: { status: booking.tokenStatus },
      newValue: { status: TokenStatus.CANCELLED },
      reason,
    });

    return sendSuccess(res, null, 'Booking cancelled successfully and slot capacity restored');
  },

  async getDigitalReceipt(req: Request, res: Response) {
    const { tokenId } = req.params;

    const booking = await prisma.booking.findUnique({
      where: { tokenId },
      include: {
        farmer: true,
        centre: true,
        qualityAssay: true,
        weighment: true,
        procurementRecord: {
          include: { payment: true },
        },
      },
    });

    if (!booking || !booking.procurementRecord) {
      return sendError(res, 'Digital receipt is only available after procurement is finalized.', 404);
    }

    const receipt = {
      receiptNumber: `RCP-${booking.procurementRecord.procurementId}`,
      issueDate: booking.procurementRecord.createdAt,
      farmer: {
        farmerId: booking.farmer.farmerId,
        fullName: booking.farmer.fullName,
        mobileNumber: booking.farmer.mobileNumber,
        village: booking.farmer.village,
        district: booking.farmer.district,
        bankName: booking.farmer.bankName,
        accountNumberMasked: booking.farmer.accountNumberMasked,
        ifscCode: booking.farmer.ifscCode,
      },
      procurementCentre: {
        centreCode: booking.centre.centreCode,
        name: booking.centre.name,
        address: booking.centre.address,
      },
      produceDetails: {
        crop: booking.crop,
        tokenNumber: booking.tokenId,
        grade: booking.qualityAssay?.grade || 'GRADE_A',
        grossWeight: booking.weighment?.grossWeight || booking.allocatedQuantity,
        tareWeight: booking.weighment?.tareWeight || 0,
        netWeight: booking.weighment?.netWeight || booking.allocatedQuantity,
        acceptedQuantity: booking.procurementRecord.acceptedQuantity,
        procurementRatePerQuintal: booking.procurementRecord.applicableRate,
        payableAmount: booking.procurementRecord.payableAmount,
      },
      paymentStatus: booking.procurementRecord.payment?.status || 'INITIATED',
      paymentReference: booking.procurementRecord.payment?.paymentReference || 'DBT Pending',
      qrVerificationData: `NIVARAN|${booking.tokenId}|${booking.procurementRecord.procurementId}|${booking.procurementRecord.payableAmount}`,
    };

    return sendSuccess(res, receipt);
  },
};
