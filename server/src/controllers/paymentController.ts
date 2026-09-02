import { Request, Response } from 'express';
import { z } from 'zod';
import { sendSuccess, sendError, sendPaginated } from '../utils/response';
import { paymentService } from '../services/paymentService';
import { PaymentStatus } from '../types';

const updatePaymentSchema = z.object({
  status: z.nativeEnum(PaymentStatus),
  paymentReference: z.string().optional(),
  failureReason: z.string().optional(),
});

export const paymentController = {
  async listPayments(req: Request, res: Response) {
    const { status, farmerId, page = '1', limit = '15' } = req.query;

    const pageNum = parseInt(String(page), 10) || 1;
    const limitNum = parseInt(String(limit), 10) || 15;

    try {
      const result = await paymentService.getPayments({
        status: status ? String(status) : undefined,
        farmerId: farmerId ? String(farmerId) : undefined,
        page: pageNum,
        limit: limitNum,
      });

      return sendPaginated(res, result.payments, pageNum, limitNum, result.total);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to list payments', 400);
    }
  },

  async updatePayment(req: Request, res: Response) {
    const { paymentId } = req.params;
    const data = updatePaymentSchema.parse(req.body);

    const actor = req.user?.fullName || 'Finance Officer';
    const actorRole = req.user?.role || 'FINANCE_OFFICER';

    try {
      const updated = await paymentService.updatePaymentStatus({
        paymentId,
        status: data.status,
        paymentReference: data.paymentReference,
        failureReason: data.failureReason,
        actor,
        actorRole,
      });

      return sendSuccess(res, updated, `Payment status updated to ${data.status}`);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to update payment status', 400);
    }
  },

  async getFinanceSummary(_req: Request, res: Response) {
    try {
      const summary = await paymentService.getFinanceSummary();
      return sendSuccess(res, summary);
    } catch (err: any) {
      return sendError(res, err.message || 'Failed to retrieve finance summary', 400);
    }
  },
};
