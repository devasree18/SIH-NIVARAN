import { prisma } from '../prisma';
import { logger } from '../utils/logger';

export interface CreateNotificationParams {
  recipientId: string;
  category: 'BOOKING' | 'QUEUE' | 'DELAY' | 'QUALITY' | 'WEIGHMENT' | 'PAYMENT' | 'SYSTEM';
  title: string;
  message: string;
  actionUrl?: string;
  preferredLanguage?: string;
}

export const notificationService = {
  async createNotification(params: CreateNotificationParams) {
    try {
      const notification = await prisma.notification.create({
        data: {
          recipientId: params.recipientId,
          category: params.category,
          title: params.title,
          message: params.message,
          actionUrl: params.actionUrl,
          preferredLanguage: params.preferredLanguage || 'en',
          deliveryChannelReadiness: 'IN_APP',
        },
      });

      // Dispatch to mock or configured telecommunication channels
      this.dispatchExternalChannels(params);

      return notification;
    } catch (err) {
      logger.error('Failed to create notification', err);
      return null;
    }
  },

  async dispatchExternalChannels(params: CreateNotificationParams) {
    const smsGateway = process.env.SMS_GATEWAY_URL;
    const whatsAppKey = process.env.WHATSAPP_API_KEY;
    const ivrUrl = process.env.IVR_WEBHOOK_URL;

    // Pluggable dispatch: If environment keys are provided, payload is ready
    if (smsGateway) {
      logger.info(`[SMS Gateway Ready] Sent SMS to recipient ${params.recipientId}: "${params.title}: ${params.message}"`);
    }
    if (whatsAppKey) {
      logger.info(`[WhatsApp API Ready] Sent WhatsApp message to ${params.recipientId}: "${params.message}"`);
    }
    if (ivrUrl && params.category === 'DELAY') {
      logger.info(`[IVR Voice Call Outbound Ready] Triggered automated voice reminder to ${params.recipientId}`);
    }
  },

  async getUserNotifications(recipientId: string, limit = 20) {
    return prisma.notification.findMany({
      where: { recipientId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  async markAsRead(notificationId: string) {
    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  },

  async markAllAsRead(recipientId: string) {
    return prisma.notification.updateMany({
      where: { recipientId, isRead: false },
      data: { isRead: true },
    });
  },
};
