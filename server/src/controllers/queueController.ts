import { Request, Response } from 'express';
import { z } from 'zod';
import { sendSuccess, sendError } from '../utils/response';
import { queueService } from '../services/queueService';
import { auditService } from '../services/auditService';
import { prisma } from '../prisma';

const checkInSchema = z.object({
  identifier: z.string().min(1, 'Token ID or Farmer ID is required'),
});

const callNextSchema = z.object({
  centreId: z.string().min(1, 'Centre ID is required'),
  counterNumber: z.number().int().positive().default(1),
});

export const queueController = {
  async checkIn(req: Request, res: Response) {
    const { identifier } = checkInSchema.parse(req.body);

    try {
      const result = await queueService.checkInFarmer(identifier, req.user?.fullName || 'Kiosk Self Check-In');
      return sendSuccess(res, result, result.message);
    } catch (err: any) {
      return sendError(res, err.message || 'Check-in failed', 400);
    }
  },

  async getLiveQueueBoard(req: Request, res: Response) {
    const { centreId } = req.params;

    try {
      const board = await queueService.getLiveQueueBoard(centreId);
      return sendSuccess(res, board);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to retrieve queue board', 400);
    }
  },

  async callNext(req: Request, res: Response) {
    const { centreId, counterNumber } = callNextSchema.parse(req.body);

    const operatorName = req.user?.fullName || 'Operator';
    try {
      const result = await queueService.callNextToken(centreId, counterNumber, operatorName);
      if (!result.token) {
        return sendSuccess(res, null, result.message);
      }
      return sendSuccess(res, result, `Called token #${result.token.tokenId} to Counter #${counterNumber}`);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to call next token', 400);
    }
  },

  async setCounterStatus(req: Request, res: Response) {
    const { centreId } = req.params;
    const { activeCounters, pauseReason } = req.body;

    const centre = await prisma.procurementCentre.findUnique({ where: { id: centreId } });
    if (!centre) return sendError(res, 'Centre not found', 404);

    const updated = await prisma.procurementCentre.update({
      where: { id: centreId },
      data: {
        activeCounters: Number(activeCounters),
      },
    });

    await auditService.log({
      actor: req.user?.fullName || 'Operator',
      actorRole: req.user?.role || 'CENTRE_OPERATOR',
      action: 'COUNTER_STATUS_CHANGE',
      entityType: 'ProcurementCentre',
      entityId: centreId,
      oldValue: { activeCounters: centre.activeCounters },
      newValue: { activeCounters: updated.activeCounters, pauseReason },
      reason: pauseReason || 'Operational counter adjustment',
    });

    return sendSuccess(res, updated, 'Counter configuration updated');
  },
};
