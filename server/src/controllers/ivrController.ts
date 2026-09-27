import { Request, Response, NextFunction } from 'express';
import { ivrService } from '../services/ivrService';
import { prisma } from '../prisma';

export const ivrController = {
  /**
   * Handle incoming IVR Call Webhook from Twilio / Exotel / Local Simulator
   */
  async handleWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = {
        CallSid: req.body.CallSid || req.query.CallSid || `SIM-${Date.now()}`,
        From: req.body.From || req.body.Caller || req.query.From || '+919876543210',
        Digits: req.body.Digits || req.body.dtmf || req.query.Digits || '',
        Step: req.body.Step || req.query.Step,
        Lang: req.body.Lang || req.query.Lang,
      };

      const response = await ivrService.handleCallStep(payload);

      // Return TwiML XML if requested, or JSON for API simulator clients
      if (req.headers.accept?.includes('application/xml') || req.headers['content-type']?.includes('application/x-www-form-urlencoded')) {
        res.type('text/xml');
        return res.send(response.twiml);
      }

      return res.status(200).json({
        success: true,
        data: response,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * Fetch recent IVR call logs for admin evaluation
   */
  async getCallLogs(req: Request, res: Response, next: NextFunction) {
    try {
      const logs = await prisma.iVRCallLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
      });

      return res.status(200).json({
        success: true,
        count: logs.length,
        data: logs,
      });
    } catch (error) {
      next(error);
    }
  },
};
