import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import { notificationService } from '../services/notificationService';

export const notificationController = {
  async getMyNotifications(req: Request, res: Response) {
    const recipientId = req.user?.farmerId || req.user?.id;
    if (!recipientId) {
      return sendError(res, 'User identification required', 400);
    }

    const notifications = await notificationService.getUserNotifications(recipientId);
    return sendSuccess(res, notifications);
  },

  async markAsRead(req: Request, res: Response) {
    const { id } = req.params;

    const updated = await notificationService.markAsRead(id);
    return sendSuccess(res, updated, 'Notification marked as read');
  },

  async markAllAsRead(req: Request, res: Response) {
    const recipientId = req.user?.farmerId || req.user?.id;
    if (!recipientId) {
      return sendError(res, 'User identification required', 400);
    }

    await notificationService.markAllAsRead(recipientId);
    return sendSuccess(res, null, 'All notifications marked as read');
  },
};
