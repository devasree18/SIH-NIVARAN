import { prisma } from '../prisma';
import { telephonyService } from './telephonyService';

export interface AutoSwapResult {
  swapped: boolean;
  centreId: string;
  originalTokenId: string;
  swappedTokenId: string;
  originalPosition: number;
  swappedPosition: number;
  notificationsDispatched: boolean;
  message: string;
}

class QueueAutoSwapService {
  /**
   * Scan for delayed farmer tokens and auto-swap queue sequence
   */
  public async processQueueAutoSwap(centreId: string): Promise<AutoSwapResult> {
    return await prisma.$transaction(async (tx) => {
      // 1. Find the earliest scheduled token that is delayed or missed check-in
      const delayedEntry = await tx.queueEntry.findFirst({
        where: {
          centreId,
          status: { in: ['SCHEDULED', 'APPROACHING'] },
        },
        orderBy: { queueNumber: 'asc' },
        include: { booking: true },
      });

      if (!delayedEntry) {
        return {
          swapped: false,
          centreId,
          originalTokenId: '',
          swappedTokenId: '',
          originalPosition: 0,
          swappedPosition: 0,
          notificationsDispatched: false,
          message: 'No delayed arrivals eligible for auto-swapping.',
        };
      }

      // 2. Find next physically waiting or checked-in farmer
      const nextWaitingEntry = await tx.queueEntry.findFirst({
        where: {
          centreId,
          status: 'CHECKED_IN',
        },
        orderBy: { queueNumber: 'asc' },
        include: { booking: true },
      });

      if (!nextWaitingEntry) {
        return {
          swapped: false,
          centreId,
          originalTokenId: delayedEntry.tokenId,
          swappedTokenId: '',
          originalPosition: delayedEntry.queueNumber,
          swappedPosition: 0,
          notificationsDispatched: false,
          message: 'No checked-in farmers waiting to take swapped slot.',
        };
      }

      // Swap positions
      const posA = delayedEntry.queueNumber;
      const posB = nextWaitingEntry.queueNumber;

      // Update entry A (delayed)
      await tx.queueEntry.update({
        where: { id: delayedEntry.id },
        data: {
          queueNumber: posB,
          status: 'DELAYED',
        },
      });

      await tx.booking.update({
        where: { id: delayedEntry.bookingId },
        data: {
          queueNumber: posB,
          queueStatus: 'DELAYED',
          tokenStatus: 'EXTENDED',
          delayMinutes: 30,
          delayReason: 'Mandi auto-swap due to arrival buffer window exceed',
        },
      });

      // Update entry B (checked-in -> promoted)
      await tx.queueEntry.update({
        where: { id: nextWaitingEntry.id },
        data: {
          queueNumber: posA,
          status: 'WAITING',
          priority: 1, // Priority bump
        },
      });

      await tx.booking.update({
        where: { id: nextWaitingEntry.bookingId },
        data: {
          queueNumber: posA,
          queueStatus: 'WAITING',
        },
      });

      // Log the auto swap transaction
      await tx.queueAutoSwapLog.create({
        data: {
          centreId,
          originalTokenId: delayedEntry.tokenId,
          swappedTokenId: nextWaitingEntry.tokenId,
          reason: 'LATE_ARRIVAL',
          originalPosition: posA,
          swappedPosition: posB,
          notificationsSent: true,
        },
      });

      // Send SMS Notifications to both farmers asynchronously
      const farmerA = await tx.farmer.findUnique({ where: { farmerId: delayedEntry.booking.farmerId } });
      const farmerB = await tx.farmer.findUnique({ where: { farmerId: nextWaitingEntry.booking.farmerId } });

      if (farmerA?.mobileNumber) {
        await telephonyService.sendNotification({
          recipient: farmerA.mobileNumber,
          templateCode: 'QUEUE_AUTOSWAP',
          language: (farmerA.preferredLanguage as any) || 'hi',
          variables: {
            tokenId: delayedEntry.tokenId,
            newPos: posB.toString(),
            newTime: 'In 30 Minutes',
          },
        });
      }

      if (farmerB?.mobileNumber) {
        await telephonyService.sendNotification({
          recipient: farmerB.mobileNumber,
          templateCode: 'QUEUE_CALLOUT',
          language: (farmerB.preferredLanguage as any) || 'hi',
          variables: {
            tokenId: nextWaitingEntry.tokenId,
            counterNum: '1',
          },
        });
      }

      return {
        swapped: true,
        centreId,
        originalTokenId: delayedEntry.tokenId,
        swappedTokenId: nextWaitingEntry.tokenId,
        originalPosition: posA,
        swappedPosition: posB,
        notificationsDispatched: true,
        message: `Successfully swapped Token #${delayedEntry.tokenId} (Pos #${posA}) with Token #${nextWaitingEntry.tokenId} (Pos #${posB}).`,
      };
    });
  }
}

export const queueAutoSwapService = new QueueAutoSwapService();
