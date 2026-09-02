import { Request, Response } from 'express';
import { sendPaginated, sendError } from '../utils/response';
import { auditService } from '../services/auditService';

export const auditController = {
  async getAuditLogs(req: Request, res: Response) {
    const { entityType, entityId, actor, page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(String(page), 10) || 1;
    const limitNum = parseInt(String(limit), 10) || 20;

    try {
      const result = await auditService.getLogs({
        entityType: entityType ? String(entityType) : undefined,
        entityId: entityId ? String(entityId) : undefined,
        actor: actor ? String(actor) : undefined,
        page: pageNum,
        limit: limitNum,
      });

      return sendPaginated(res, result.logs, pageNum, limitNum, result.total);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to retrieve audit logs', 400);
    }
  },
};
