import { prisma } from '../prisma';
import { logger } from '../utils/logger';

export interface AuditParams {
  actor: string;
  actorRole: string;
  action: string;
  entityType: string;
  entityId: string;
  oldValue?: any;
  newValue?: any;
  reason: string;
  correlationId?: string;
}

export const auditService = {
  async log(params: AuditParams) {
    try {
      const record = await prisma.auditLog.create({
        data: {
          actor: params.actor,
          actorRole: params.actorRole,
          action: params.action,
          entityType: params.entityType,
          entityId: params.entityId,
          oldValue: params.oldValue ? JSON.stringify(params.oldValue) : null,
          newValue: params.newValue ? JSON.stringify(params.newValue) : null,
          reason: params.reason,
          correlationId: params.correlationId,
        },
      });
      return record;
    } catch (err) {
      logger.error('Failed to create audit log entry', err);
      return null;
    }
  },

  async getLogs(filter: { entityType?: string; entityId?: string; actor?: string; limit?: number; page?: number }) {
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filter.entityType) where.entityType = filter.entityType;
    if (filter.entityId) where.entityId = filter.entityId;
    if (filter.actor) where.actor = filter.actor;

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    return { total, logs, page, limit };
  },
};
