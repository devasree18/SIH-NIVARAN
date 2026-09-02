import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { sendSuccess, sendError } from '../utils/response';
import { procurementService } from '../services/procurementService';
import { QualityStatus } from '../types';

const recordWeighmentSchema = z.object({
  tokenId: z.string().min(1),
  grossWeight: z.number().positive('Gross weight must be greater than zero'),
  tareWeight: z.number().min(0, 'Tare weight cannot be negative'),
});

export const weighmentController = {
  async getAwaitingWeighment(req: Request, res: Response) {
    const { centreId } = req.query;

    const where: any = {
      qualityAssay: {
        qualityStatus: QualityStatus.PASSED,
      },
      weighment: null,
    };
    if (centreId) where.centreId = String(centreId);

    const awaiting = await prisma.booking.findMany({
      where,
      include: {
        farmer: true,
        centre: true,
        qualityAssay: true,
      },
      orderBy: { scheduledDateTime: 'asc' },
    });

    const recentCompleted = await prisma.weighment.findMany({
      include: {
        booking: {
          include: { farmer: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return sendSuccess(res, { awaiting, recentCompleted });
  },

  async recordWeighment(req: Request, res: Response) {
    const data = recordWeighmentSchema.parse(req.body);

    const operatorId = req.user?.id || 'WEIGH-OP-01';
    const operatorName = req.user?.fullName || 'Weighment Operator';

    try {
      const result = await procurementService.recordWeighment({
        tokenId: data.tokenId,
        operatorId,
        operatorName,
        grossWeight: data.grossWeight,
        tareWeight: data.tareWeight,
      });

      const message = result.adjustmentRequest
        ? `Weighment recorded. Net weight: ${result.weighment.netWeight} Qtl. Excess quantity detected; forwarded for Centre Manager approval.`
        : `Weighment recorded. Net weight: ${result.weighment.netWeight} Qtl. Procurement confirmed.`;

      return sendSuccess(res, result, message);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to record weighment', 400);
    }
  },
};
