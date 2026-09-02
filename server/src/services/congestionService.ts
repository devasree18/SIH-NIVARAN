import { prisma } from '../prisma';
import { CongestionLevel, CongestionResult } from '../types';

export const congestionService = {
  async calculateCentreCongestion(centreId: string, targetDate?: string): Promise<CongestionResult> {
    const todayStr = targetDate || new Date().toISOString().split('T')[0];

    const centre = await prisma.procurementCentre.findUnique({
      where: { id: centreId },
    });

    if (!centre) {
      throw new Error(`Procurement centre ${centreId} not found`);
    }

    // Fetch queue entries for today
    const queueEntries = await prisma.queueEntry.findMany({
      where: {
        centreId,
        serviceDate: todayStr,
      },
    });

    const waitingFarmers = queueEntries.filter((q) => q.status === 'WAITING' || q.status === 'CHECKED_IN');
    const checkedInCount = queueEntries.filter((q) => q.status !== 'SCHEDULED').length;
    const activeCounters = Math.max(1, centre.activeCounters || 1);
    const avgServiceMinutes = centre.averageServiceMinutes || 15;

    // Fetch any active centre delays today
    const recentDelays = await prisma.centreDelay.findMany({
      where: {
        centreId,
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 3,
    });

    const currentDelayMinutes = recentDelays.reduce((sum, d) => sum + d.delayMinutes, 0);

    // Dynamic wait formula:
    // (Waiting Farmers * Avg Service Minutes) / Active Counters + current active delay
    const rawWaitMinutes = Math.round((waitingFarmers.length * avgServiceMinutes) / activeCounters) + currentDelayMinutes;
    const estimatedWaitMinutes = Math.max(0, rawWaitMinutes);

    // Determine Congestion Level and Contributing Factors
    const contributingFactors: string[] = [];
    let congestionLevel = CongestionLevel.LOW;

    if (!centre.weighbridgeAvailability) {
      contributingFactors.push('Weighbridge is currently non-operational or undergoing maintenance');
    }
    if (!centre.operatorAvailability) {
      contributingFactors.push('Assay or Weighment operator shortages reported');
    }
    if (currentDelayMinutes > 0) {
      contributingFactors.push(`Active centre delay of ${currentDelayMinutes} mins logged (${recentDelays[0]?.reason})`);
    }
    if (waitingFarmers.length > activeCounters * 4) {
      contributingFactors.push(`High queue backlog: ${waitingFarmers.length} farmers waiting across ${activeCounters} counters`);
    }
    if (centre.operationalStatus === 'PAUSED' || centre.operationalStatus === 'LIMITED') {
      contributingFactors.push(`Centre status is currently ${centre.operationalStatus}`);
    }

    // Congestion thresholding
    if (
      centre.operationalStatus === 'PAUSED' ||
      !centre.weighbridgeAvailability ||
      estimatedWaitMinutes >= 90
    ) {
      congestionLevel = CongestionLevel.CRITICAL;
    } else if (estimatedWaitMinutes >= 60 || !centre.operatorAvailability) {
      congestionLevel = CongestionLevel.HIGH;
    } else if (estimatedWaitMinutes >= 30) {
      congestionLevel = CongestionLevel.MODERATE;
    } else {
      congestionLevel = CongestionLevel.LOW;
    }

    if (contributingFactors.length === 0) {
      contributingFactors.push('Operations running smoothly at normal capacity');
    }

    // Suggested arrival shift in minutes (if high congestion, suggest arriving later)
    let suggestedArrivalShiftMinutes = 0;
    if (congestionLevel === CongestionLevel.CRITICAL) {
      suggestedArrivalShiftMinutes = Math.min(120, currentDelayMinutes + 45);
    } else if (congestionLevel === CongestionLevel.HIGH) {
      suggestedArrivalShiftMinutes = Math.min(60, currentDelayMinutes + 30);
    } else if (congestionLevel === CongestionLevel.MODERATE) {
      suggestedArrivalShiftMinutes = Math.min(30, currentDelayMinutes);
    }

    return {
      centreId,
      congestionLevel,
      waitingFarmersCount: waitingFarmers.length,
      checkedInCount,
      activeCounters,
      averageServiceMinutes: avgServiceMinutes,
      estimatedWaitMinutes,
      currentDelayMinutes,
      suggestedArrivalShiftMinutes,
      contributingFactors,
    };
  },
};
