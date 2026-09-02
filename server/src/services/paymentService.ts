import { prisma } from '../prisma';
import { auditService } from './auditService';
import { notificationService } from './notificationService';
import { PaymentStatus } from '../types';

export const paymentService = {
  async getPayments(filters: {
    status?: string;
    farmerId?: string;
    centreId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 15;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.status) where.status = filters.status;
    if (filters.farmerId) where.farmerId = filters.farmerId;

    const [total, payments] = await Promise.all([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        include: {
          farmer: {
            select: {
              id: true,
              farmerId: true,
              fullName: true,
              mobileNumber: true,
              bankName: true,
              accountNumberMasked: true,
              ifscCode: true,
            },
          },
          procurement: {
            select: {
              procurementId: true,
              crop: true,
              finalProcuredQuantity: true,
              applicableRate: true,
              createdAt: true,
              centre: { select: { name: true, centreCode: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
    ]);

    // Calculate aging summary
    const now = new Date().getTime();
    const paymentsWithAging = payments.map((p) => {
      const createdTime = new Date(p.createdAt).getTime();
      const ageHours = Math.floor((now - createdTime) / (1000 * 60 * 60));
      return {
        ...p,
        ageHours,
        isDelayed: ageHours > 48 && p.status !== PaymentStatus.PAID,
      };
    });

    return { total, payments: paymentsWithAging, page, limit };
  },

  async updatePaymentStatus(params: {
    paymentId: string;
    status: PaymentStatus;
    paymentReference?: string;
    failureReason?: string;
    actor: string;
    actorRole: string;
  }) {
    const payment = await prisma.payment.findUnique({
      where: { paymentId: params.paymentId },
      include: {
        farmer: true,
        procurement: true,
      },
    });

    if (!payment) {
      throw new Error(`Payment record ${params.paymentId} not found`);
    }

    const completedAt = params.status === PaymentStatus.PAID ? new Date() : payment.completedAt;

    const updated = await prisma.payment.update({
      where: { paymentId: params.paymentId },
      data: {
        status: params.status,
        paymentReference: params.paymentReference || payment.paymentReference,
        failureReason: params.failureReason || null,
        completedAt,
      },
    });

    // Notify farmer of payment milestone
    let notifMessage = '';
    if (params.status === PaymentStatus.APPROVED) {
      notifMessage = `Your DBT payment of ₹${payment.payableAmount.toLocaleString('en-IN')} has been approved by the treasury. Remittance reference will follow shortly.`;
    } else if (params.status === PaymentStatus.PAID) {
      notifMessage = `Payment of ₹${payment.payableAmount.toLocaleString('en-IN')} successfully credited via DBT. Reference: ${params.paymentReference || 'PFMS-CR-2026'}.`;
    } else if (params.status === PaymentStatus.FAILED) {
      notifMessage = `Your DBT payment encountered an error: ${params.failureReason || 'Bank account mismatch'}. Our finance team is reviewing.`;
    }

    if (notifMessage) {
      await notificationService.createNotification({
        recipientId: payment.farmerId,
        category: 'PAYMENT',
        title: `Payment Update: ${params.status}`,
        message: notifMessage,
        actionUrl: `/farmer/payments`,
        preferredLanguage: payment.farmer.preferredLanguage,
      });
    }

    // Audit log
    await auditService.log({
      actor: params.actor,
      actorRole: params.actorRole,
      action: 'PAYMENT_STATUS_UPDATE',
      entityType: 'Payment',
      entityId: payment.id,
      oldValue: { status: payment.status },
      newValue: { status: params.status, paymentReference: params.paymentReference, failureReason: params.failureReason },
      reason: `Finance Officer action: marked as ${params.status}`,
    });

    return updated;
  },

  async getFinanceSummary() {
    const [totalValueAgg, paidValueAgg, pendingCount, paidCount, failedCount, onHoldCount] = await Promise.all([
      prisma.payment.aggregate({ _sum: { payableAmount: true } }),
      prisma.payment.aggregate({
        where: { status: PaymentStatus.PAID },
        _sum: { payableAmount: true },
      }),
      prisma.payment.count({ where: { status: { in: [PaymentStatus.INITIATED, PaymentStatus.PROCESSING, PaymentStatus.APPROVED] } } }),
      prisma.payment.count({ where: { status: PaymentStatus.PAID } }),
      prisma.payment.count({ where: { status: PaymentStatus.FAILED } }),
      prisma.payment.count({ where: { status: PaymentStatus.ON_HOLD } }),
    ]);

    return {
      totalDisbursementValue: totalValueAgg._sum.payableAmount || 0,
      settledValue: paidValueAgg._sum.payableAmount || 0,
      pendingDisbursementCount: pendingCount,
      settledCount: paidCount,
      failedCount,
      onHoldCount,
    };
  },
};
