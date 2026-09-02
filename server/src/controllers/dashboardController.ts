import { Request, Response } from 'express';
import { sendSuccess, sendError } from '../utils/response';
import { analyticsService } from '../services/analyticsService';

export const dashboardController = {
  async getFarmerDashboard(req: Request, res: Response) {
    const farmerId = req.user?.farmerId;
    if (!farmerId) {
      return sendError(res, 'Farmer identification not associated with user', 403);
    }

    try {
      const data = await analyticsService.getFarmerDashboardData(farmerId);
      return sendSuccess(res, data);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch farmer dashboard', 400);
    }
  },

  async getAdminDashboard(req: Request, res: Response) {
    const { centreId } = req.query;
    const targetCentreId = (centreId as string) || req.user?.centreId;

    if (!targetCentreId) {
      return sendError(res, 'Centre ID is required', 400);
    }

    try {
      const data = await analyticsService.getCentreAdminDashboardData(targetCentreId);
      return sendSuccess(res, data);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to fetch admin dashboard', 400);
    }
  },
};
