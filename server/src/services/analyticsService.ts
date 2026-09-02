import { prisma } from '../prisma';
import { congestionService } from './congestionService';
import { QueueStatus, TokenStatus, QualityStatus } from '../types';

export const analyticsService = {
  async getFarmerDashboardData(farmerId: string) {
    const todayStr = new Date().toISOString().split('T')[0];

    // Fetch active or latest booking
    const activeBooking = await prisma.booking.findFirst({
      where: {
        farmerId,
        tokenStatus: { in: [TokenStatus.ACTIVE, TokenStatus.EXTENDED] },
      },
      include: {
        centre: true,
        slot: true,
        queueEntry: true,
        qualityAssay: true,
        weighment: true,
        quantityAdjustment: true,
        procurementRecord: {
          include: { payment: true },
        },
      },
      orderBy: { scheduledDateTime: 'desc' },
    });

    // Determine farmers ahead in queue if checked in
    let farmersAhead = 0;
    let estimatedWaitMinutes = 0;
    let nextAction = 'Book an appointment for crop procurement';

    if (activeBooking) {
      if (activeBooking.queueStatus === QueueStatus.SCHEDULED) {
        nextAction = `Arrive at Mandi by ${new Date(activeBooking.scheduledDateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} with your produce and Token #${activeBooking.tokenId}.`;
      } else if (activeBooking.queueStatus === QueueStatus.WAITING) {
        // Count farmers ahead of this token
        farmersAhead = await prisma.queueEntry.count({
          where: {
            centreId: activeBooking.centreId,
            serviceDate: todayStr,
            status: QueueStatus.WAITING,
            queueNumber: { lt: activeBooking.queueNumber },
          },
        });
        estimatedWaitMinutes = (farmersAhead + 1) * (activeBooking.centre.averageServiceMinutes || 15);
        nextAction = `Waiting in queue. ${farmersAhead} farmer(s) ahead. Keep your sample ready for Counter call.`;
      } else if (activeBooking.queueStatus === QueueStatus.CALLED) {
        nextAction = 'Token called! Proceed immediately to designated counter for Quality & Assay verification.';
      } else if (activeBooking.queueStatus === QueueStatus.PROCESSING) {
        if (!activeBooking.qualityAssay || activeBooking.qualityAssay.qualityStatus === QualityStatus.PENDING) {
          nextAction = 'Quality testing in progress. Awaiting assay report.';
        } else if (activeBooking.qualityAssay.qualityStatus === QualityStatus.PASSED && !activeBooking.weighment) {
          nextAction = 'Quality Assay passed! Proceed to Weighbridge for gross vehicle weighment.';
        } else if (activeBooking.quantityAdjustment?.approvalStatus === 'PENDING') {
          nextAction = 'Excess quantity detected. Awaiting Centre Manager capacity approval.';
        } else {
          nextAction = 'Procurement recorded. Payment Direct Benefit Transfer is in progress.';
        }
      } else if (activeBooking.queueStatus === QueueStatus.COMPLETED) {
        nextAction = 'Procurement complete. Track your DBT remittance status in the Payment tab.';
      }
    }

    // Fetch past procurement history
    const history = await prisma.procurementRecord.findMany({
      where: { farmerId },
      include: {
        centre: { select: { name: true, district: true } },
        payment: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    // Fetch unread notifications
    const notifications = await prisma.notification.findMany({
      where: { recipientId: farmerId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    return {
      activeBooking,
      farmersAhead,
      estimatedWaitMinutes,
      nextAction,
      history,
      recentNotifications: notifications,
    };
  },

  async getCentreAdminDashboardData(centreId: string) {
    const todayStr = new Date().toISOString().split('T')[0];

    const centre = await prisma.procurementCentre.findUnique({
      where: { id: centreId },
      include: {
        slots: {
          where: { date: todayStr },
          orderBy: { startTime: 'asc' },
        },
      },
    });

    if (!centre) throw new Error('Centre not found');

    const [
      scheduledToday,
      checkedInCount,
      waitingCount,
      completedToday,
      pendingQualityCount,
      pendingWeighmentCount,
      pendingAdjustmentsCount,
      procuredQuantityTodayAgg,
      pendingPaymentsCount,
      congestion,
    ] = await Promise.all([
      prisma.queueEntry.count({ where: { centreId, serviceDate: todayStr } }),
      prisma.queueEntry.count({ where: { centreId, serviceDate: todayStr, status: { not: QueueStatus.SCHEDULED } } }),
      prisma.queueEntry.count({ where: { centreId, serviceDate: todayStr, status: QueueStatus.WAITING } }),
      prisma.queueEntry.count({ where: { centreId, serviceDate: todayStr, status: QueueStatus.COMPLETED } }),
      prisma.booking.count({
        where: {
          centreId,
          queueStatus: { in: [QueueStatus.CALLED, QueueStatus.WAITING] },
          qualityAssay: null,
        },
      }),
      prisma.booking.count({
        where: {
          centreId,
          qualityAssay: { qualityStatus: QualityStatus.PASSED },
          weighment: null,
        },
      }),
      prisma.quantityAdjustmentRequest.count({
        where: {
          booking: { centreId },
          approvalStatus: 'PENDING',
        },
      }),
      prisma.procurementRecord.aggregate({
        where: { centreId, createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) } },
        _sum: { finalProcuredQuantity: true },
      }),
      prisma.payment.count({
        where: { procurement: { centreId }, status: { in: ['INITIATED', 'PROCESSING'] } },
      }),
      congestionService.calculateCentreCongestion(centreId, todayStr),
    ]);

    // Slot occupancy summary
    const totalSlotCapacity = centre.slots.reduce((sum, s) => sum + s.capacity, 0);
    const totalReservedQuantity = centre.slots.reduce((sum, s) => sum + s.reservedQuantity, 0);
    const occupancyPercent = totalSlotCapacity > 0 ? Math.round((totalReservedQuantity / totalSlotCapacity) * 100) : 0;

    return {
      centre: {
        id: centre.id,
        name: centre.name,
        code: centre.centreCode,
        dailyCapacity: centre.dailyCapacity,
        activeCounters: centre.activeCounters,
        operationalStatus: centre.operationalStatus,
        weighbridgeAvailability: centre.weighbridgeAvailability,
        operatorAvailability: centre.operatorAvailability,
      },
      metrics: {
        scheduledToday,
        checkedInCount,
        waitingCount,
        completedToday,
        totalSlotCapacity,
        totalReservedQuantity,
        occupancyPercent,
        procuredQuantityToday: procuredQuantityTodayAgg._sum.finalProcuredQuantity || 0,
        pendingQualityCount,
        pendingWeighmentCount,
        pendingAdjustmentsCount,
        pendingPaymentsCount,
      },
      congestion,
      slots: centre.slots,
    };
  },
};
