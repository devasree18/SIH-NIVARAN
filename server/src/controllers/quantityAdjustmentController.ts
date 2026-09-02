import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { sendSuccess, sendError } from '../utils/response';
import { procurementService } from '../services/procurementService';

const decisionSchema = z.object({
  approved: z.boolean(),
  reason: z.string().min(3, 'Decision justification is required'),
});

export const quantityAdjustmentController = {
  async listPendingAdjustments(req: Request, res: Response) {
    const { centreId } = req.query;

    const where: any = {
      approvalStatus: 'PENDING',
    };
    if (centreId) {
      where.booking = { centreId: String(centreId) };
    }

    const adjustments = await prisma.quantityAdjustmentRequest.findMany({
      where,
      include: {
        booking: {
          include: {
            farmer: true,
            centre: true,
            weighment: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return sendSuccess(res, adjustments);
  },

  async handleDecision(req: Request, res: Response) {
    const { id } = req.params;
    const { approved, reason } = decisionSchema.parse(req.body);

    const managerName = req.user?.fullName || 'Centre Manager';

    try {
      const updated = await procurementService.approveQuantityAdjustment(id, managerName, approved, reason);
      return sendSuccess(res, updated, `Quantity adjustment ${approved ? 'approved' : 'rejected'}`);
    } catch (err: any) {
      return sendError(res, err.message || 'Decision processing failed', 400);
    }
  },
};
