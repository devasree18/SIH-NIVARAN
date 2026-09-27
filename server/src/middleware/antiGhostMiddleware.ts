import { Request, Response, NextFunction } from 'express';
import { prisma } from '../prisma';

export async function antiGhostProtection(req: Request, res: Response, next: NextFunction) {
  try {
    const { farmerId, mobileNumber, pmKisanId, requestedQuantity } = req.body;
    const identifier = farmerId || pmKisanId || mobileNumber || req.user?.username;

    if (!identifier) {
      return res.status(400).json({
        success: false,
        error: 'AntiGhost Security Violation: Farmer identifier (PM-Kisan ID or Verified Mobile) is required.',
      });
    }

    // 1. Check Rate-Limiting Verification Record in Database
    let verification = await prisma.antiGhostVerification.findFirst({
      where: {
        identifier,
      },
      orderBy: { createdAt: 'desc' },
    });

    const now = new Date();

    if (verification) {
      // Check if blocked due to excessive ghost requests
      if (verification.blockedUntil && verification.blockedUntil > now) {
        return res.status(429).json({
          success: false,
          error: `Anti-Ghost Security Lock: Excessive booking attempts detected for ${identifier}. Locked until ${verification.blockedUntil.toLocaleTimeString()}.`,
        });
      }

      // Check request count within 24 hour window
      const windowHours = (now.getTime() - new Date(verification.rateLimitWindow).getTime()) / (1000 * 60 * 60);

      if (windowHours < 24) {
        if (verification.requestCount24h >= 5) {
          // Exceeded 24h quota - Lock for 6 hours
          const blockUntil = new Date(now.getTime() + 6 * 60 * 60 * 1000);
          await prisma.antiGhostVerification.update({
            where: { id: verification.id },
            data: { blockedUntil: blockUntil },
          });

          return res.status(429).json({
            success: false,
            error: `Anti-Ghost Security Limit Reached: Maximum 5 daily token requests allowed per verified PM-Kisan account.`,
          });
        }

        // Increment attempt count
        await prisma.antiGhostVerification.update({
          where: { id: verification.id },
          data: {
            requestCount24h: verification.requestCount24h + 1,
            attemptsCount: verification.attemptsCount + 1,
          },
        });
      } else {
        // Reset window
        await prisma.antiGhostVerification.update({
          where: { id: verification.id },
          data: {
            rateLimitWindow: now,
            requestCount24h: 1,
            blockedUntil: null,
          },
        });
      }
    } else {
      // Create fresh verification record
      await prisma.antiGhostVerification.create({
        data: {
          identifier,
          identifierType: pmKisanId ? 'PM_KISAN' : mobileNumber ? 'MOBILE' : 'AADHAAR',
          isVerified: true,
          verifiedAt: now,
          rateLimitWindow: now,
          requestCount24h: 1,
        },
      });
    }

    // 2. PM-Kisan Land Yield Cap Check
    if (requestedQuantity && farmerId) {
      const farmer = await prisma.farmer.findUnique({ where: { farmerId } });
      if (farmer) {
        try {
          const landDetails = JSON.parse(farmer.landDetails || '{}');
          const acreage = parseFloat(landDetails.acreage) || 5.0;
          const maxYieldCap = acreage * 25.0; // Max 25 Quintals yield per acre standard cap

          if (requestedQuantity > maxYieldCap) {
            return res.status(400).json({
              success: false,
              error: `Anti-Ghost Protection Rejection: Requested quantity (${requestedQuantity} Qtl) exceeds PM-Kisan verified yield limit (${maxYieldCap} Qtl for ${acreage} Acres).`,
            });
          }
        } catch (e) {
          // Ignore JSON parse fail
        }
      }
    }

    next();
  } catch (error) {
    next(error);
  }
}
