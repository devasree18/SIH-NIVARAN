import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { sendSuccess, sendError } from '../utils/response';
import { procurementService } from '../services/procurementService';
import { QueueStatus, QualityStatus } from '../types';

const recordAssaySchema = z.object({
  tokenId: z.string().min(1),
  moisturePercentage: z.number().min(0).max(100),
  foreignMatterPercentage: z.number().min(0).max(100),
  damagedGrainsPercentage: z.number().min(0).max(100),
  admixturePercentage: z.number().min(0).max(100).optional(),
  attachmentRef: z.string().optional(),
  notes: z.string().optional(),
});

export const qualityController = {
  async getPendingTests(req: Request, res: Response) {
    const { centreId } = req.query;

    const where: any = {
      queueStatus: { in: [QueueStatus.CALLED, QueueStatus.WAITING, QueueStatus.PROCESSING] },
      qualityAssay: null,
    };
    if (centreId) where.centreId = String(centreId);

    const pending = await prisma.booking.findMany({
      where,
      include: {
        farmer: true,
        centre: true,
      },
      orderBy: { queueNumber: 'asc' },
    });

    const recentCompleted = await prisma.qualityAssay.findMany({
      include: {
        booking: {
          include: { farmer: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return sendSuccess(res, {
      pending,
      recentCompleted,
    });
  },

  async recordAssay(req: Request, res: Response) {
    const data = recordAssaySchema.parse(req.body);

    const officerId = req.user?.id || 'QO-DEFAULT';
    const officerName = req.user?.fullName || 'Quality Officer';

    try {
      const assay = await procurementService.recordQualityAssay({
        tokenId: data.tokenId,
        officerId,
        officerName,
        moisturePercentage: data.moisturePercentage,
        foreignMatterPercentage: data.foreignMatterPercentage,
        damagedGrainsPercentage: data.damagedGrainsPercentage,
        admixturePercentage: data.admixturePercentage,
        attachmentRef: data.attachmentRef,
        notes: data.notes,
      });

      return sendSuccess(res, assay, `Assay test recorded. Result: ${assay.grade} (${assay.qualityStatus})`);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to record assay', 400);
    }
  },

  async requestRetest(req: Request, res: Response) {
    const { tokenId } = req.params;
    const { reason } = req.body;

    const existingAssay = await prisma.qualityAssay.findUnique({
      where: { tokenId },
    });

    if (!existingAssay) {
      return sendError(res, 'Quality assay record not found for this token', 404);
    }

    if (existingAssay.retestCount >= 2) {
      return sendError(res, 'Maximum allowable re-test attempts (2) reached for this batch.', 400);
    }

    const updated = await prisma.qualityAssay.update({
      where: { tokenId },
      data: {
        qualityStatus: QualityStatus.RETEST_REQUIRED,
        retestCount: existingAssay.retestCount + 1,
        decisionReason: `Re-test authorized: ${reason || 'Farmer appeal / moisture re-check'}`,
      },
    });

    return sendSuccess(res, updated, 'Re-test authorized. Sample queued for second assay.');
  },
};
