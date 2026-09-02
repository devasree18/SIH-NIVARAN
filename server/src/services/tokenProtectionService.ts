import { prisma } from '../prisma';
import { auditService } from './auditService';
import { notificationService } from './notificationService';
import { TokenStatus } from '../types';
import { logger } from '../utils/logger';

export interface RecordDelayParams {
  centreId: string;
  reason: 'CONGESTION' | 'MACHINERY_FAILURE' | 'WEATHER' | 'SERVER_OUTAGE' | 'ADMINISTRATIVE_DELAY' | 'CENTRE_CLOSURE' | 'OTHER';
  description: string;
  delayMinutes: number;
  authorizedAction: 'EXTEND_VALIDITY' | 'RESCHEDULE' | 'NOTIFY_ONLY';
  createdBy: string;
  creatorRole: string;
}

export const tokenProtectionService = {
  async recordCentreDelay(params: RecordDelayParams) {
    const { centreId, reason, description, delayMinutes, authorizedAction, createdBy, creatorRole } = params;

    const now = new Date();
    const expectedResolution = new Date(now.getTime() + delayMinutes * 60 * 1000);

    // Find all active or scheduled tokens for this centre that haven't been completed yet
    const activeBookings = await prisma.booking.findMany({
      where: {
        centreId,
        tokenStatus: { in: [TokenStatus.ACTIVE, TokenStatus.EXTENDED] },
        queueStatus: { notIn: ['COMPLETED', 'CANCELLED'] },
        scheduledDateTime: {
          gte: new Date(now.setHours(0, 0, 0, 0)),
        },
      },
      include: {
        farmer: true,
        centre: true,
      },
    });

    // Create Centre Delay record
    const delayRecord = await prisma.centreDelay.create({
      data: {
        centreId,
        reason,
        description,
        delayMinutes,
        affectedTokensCount: activeBookings.length,
        startTime: new Date(),
        expectedResolution,
        authorizedAction,
        createdBy,
      },
    });

    let updatedCount = 0;

    // Apply token protection logic: extend validity so farmer is never penalized
    for (const booking of activeBookings) {
      const oldValidityEnd = new Date(booking.validityEnd);
      const newValidityEnd = new Date(oldValidityEnd.getTime() + delayMinutes * 60 * 1000);

      if (authorizedAction === 'EXTEND_VALIDITY') {
        await prisma.booking.update({
          where: { id: booking.id },
          data: {
            validityEnd: newValidityEnd,
            delayMinutes: booking.delayMinutes + delayMinutes,
            delayReason: `${reason}: ${description}`,
            tokenStatus: TokenStatus.EXTENDED,
          },
        });

        // Audit the extension
        await auditService.log({
          actor: createdBy,
          actorRole: creatorRole,
          action: 'TOKEN_PROTECTION_EXTENSION',
          entityType: 'Booking',
          entityId: booking.id,
          oldValue: { validityEnd: oldValidityEnd, status: booking.tokenStatus },
          newValue: { validityEnd: newValidityEnd, status: TokenStatus.EXTENDED, delayMinutes },
          reason: `Centre-side delay: ${reason} - ${description}`,
        });

        // Notify the farmer with precise timing
        const scheduledTimeStr = new Date(booking.scheduledDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const suggestedArrival = new Date(new Date(booking.scheduledDateTime).getTime() + delayMinutes * 60 * 1000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

        await notificationService.createNotification({
          recipientId: booking.farmerId,
          category: 'DELAY',
          title: 'Procurement Centre Delay - Token Automatically Protected',
          message: `Your centre (${booking.centre.name}) is experiencing a ${delayMinutes}-minute delay due to ${reason.toLowerCase().replace('_', ' ')}. Your token #${booking.tokenId} validity has been automatically extended. Please arrive at ${suggestedArrival} instead of ${scheduledTimeStr}. You will NOT be penalized.`,
          actionUrl: `/farmer/token/${booking.tokenId}`,
          preferredLanguage: booking.farmer.preferredLanguage,
        });

        updatedCount++;
      } else if (authorizedAction === 'NOTIFY_ONLY') {
        await notificationService.createNotification({
          recipientId: booking.farmerId,
          category: 'DELAY',
          title: 'Advisory: Mandi Operational Congestion',
          message: `${booking.centre.name} is reporting higher traffic today. Current average wait is ${delayMinutes} minutes. Token #${booking.tokenId} remains active.`,
          actionUrl: `/farmer/token/${booking.tokenId}`,
          preferredLanguage: booking.farmer.preferredLanguage,
        });
      }
    }

    logger.info(`Centre delay of ${delayMinutes} mins processed for ${centreId}. ${updatedCount} tokens protected.`);

    return {
      delayRecord,
      affectedTokensCount: activeBookings.length,
      protectedTokensCount: updatedCount,
    };
  },

  async manuallyExtendToken(params: {
    tokenId: string;
    extraMinutes: number;
    reason: string;
    actor: string;
    actorRole: string;
  }) {
    const booking = await prisma.booking.findUnique({
      where: { tokenId: params.tokenId },
      include: { farmer: true, centre: true },
    });

    if (!booking) {
      throw new Error(`Token ${params.tokenId} not found`);
    }

    const oldValidity = new Date(booking.validityEnd);
    const newValidity = new Date(oldValidity.getTime() + params.extraMinutes * 60 * 1000);

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        validityEnd: newValidity,
        delayMinutes: booking.delayMinutes + params.extraMinutes,
        tokenStatus: TokenStatus.EXTENDED,
      },
    });

    await auditService.log({
      actor: params.actor,
      actorRole: params.actorRole,
      action: 'MANUAL_TOKEN_EXTENSION',
      entityType: 'Booking',
      entityId: booking.id,
      oldValue: { validityEnd: oldValidity },
      newValue: { validityEnd: newValidity, extraMinutes: params.extraMinutes },
      reason: params.reason,
    });

    await notificationService.createNotification({
      recipientId: booking.farmerId,
      category: 'DELAY',
      title: 'Token Validity Extended',
      message: `Your token #${booking.tokenId} validity has been manually extended by ${params.extraMinutes} minutes. Reason: ${params.reason}`,
      actionUrl: `/farmer/token/${booking.tokenId}`,
      preferredLanguage: booking.farmer.preferredLanguage,
    });

    return updated;
  },
};
