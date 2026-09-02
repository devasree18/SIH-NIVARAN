import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../prisma';
import { sendSuccess, sendError } from '../utils/response';
import { tokenProtectionService } from '../services/tokenProtectionService';

const createDelaySchema = z.object({
  centreId: z.string().min(1),
  reason: z.enum(['CONGESTION', 'MACHINERY_FAILURE', 'WEATHER', 'SERVER_OUTAGE', 'ADMINISTRATIVE_DELAY', 'CENTRE_CLOSURE', 'OTHER']),
  description: z.string().min(3),
  delayMinutes: z.number().int().positive('Delay minutes must be positive'),
  authorizedAction: z.enum(['EXTEND_VALIDITY', 'RESCHEDULE', 'NOTIFY_ONLY']).default('EXTEND_VALIDITY'),
});

export const delayController = {
  async recordDelay(req: Request, res: Response) {
    const data = createDelaySchema.parse(req.body);

    const createdBy = req.user?.fullName || 'Centre Operator';
    const creatorRole = req.user?.role || 'CENTRE_OPERATOR';

    try {
      const result = await tokenProtectionService.recordCentreDelay({
        centreId: data.centreId,
        reason: data.reason,
        description: data.description,
        delayMinutes: data.delayMinutes,
        authorizedAction: data.authorizedAction,
        createdBy,
        creatorRole,
      });

      return sendSuccess(
        res,
        result,
        `Delay recorded. ${result.protectedTokensCount} active tokens protected with automatic validity extension.`
      );
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to record centre delay', 400);
    }
  },

  async listCentreDelays(req: Request, res: Response) {
    const { centreId } = req.query;

    const where: any = {};
    if (centreId) where.centreId = String(centreId);

    const delays = await prisma.centreDelay.findMany({
      where,
      include: {
        centre: { select: { name: true, centreCode: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    return sendSuccess(res, delays);
  },
};
