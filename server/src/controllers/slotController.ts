import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { sendSuccess, sendError } from '../utils/response';
import { congestionService } from '../services/congestionService';

export const slotController = {
  async getSlotsByCentreAndDate(req: Request, res: Response) {
    const { centreId, date } = req.query;

    if (!centreId || !date) {
      return sendError(res, 'centreId and date (YYYY-MM-DD) are required query parameters', 400);
    }

    const slots = await prisma.slot.findMany({
      where: {
        centreId: String(centreId),
        date: String(date),
      },
      orderBy: { startTime: 'asc' },
    });

    const congestion = await congestionService.calculateCentreCongestion(String(centreId), String(date));

    const formattedSlots = slots.map((s) => ({
      ...s,
      occupancyPercentage: s.capacity > 0 ? Math.round((s.reservedQuantity / s.capacity) * 100) : 0,
      isAvailable: s.slotStatus === 'AVAILABLE' && s.availableQuantity > 0,
    }));

    return sendSuccess(res, {
      centreId,
      date,
      slots: formattedSlots,
      congestion,
    });
  },

  async generateDailySlots(req: Request, res: Response) {
    const { centreId, date, slotCapacity = 50.0 } = req.body;

    if (!centreId || !date) {
      return sendError(res, 'centreId and date are required', 400);
    }

    const centre = await prisma.procurementCentre.findUnique({ where: { id: centreId } });
    if (!centre) {
      return sendError(res, 'Centre not found', 404);
    }

    // Default time windows: 8 slots from 08:00 to 18:00
    const timeSlots = [
      { start: '08:00', end: '09:00' },
      { start: '09:00', end: '10:00' },
      { start: '10:00', end: '11:00' },
      { start: '11:00', end: '12:00' },
      { start: '13:00', end: '14:00' },
      { start: '14:00', end: '15:00' },
      { start: '15:00', end: '16:00' },
      { start: '16:00', end: '17:30' },
    ];

    const createdSlots = [];

    for (const ts of timeSlots) {
      const slot = await prisma.slot.upsert({
        where: {
          centreId_date_startTime: {
            centreId,
            date,
            startTime: ts.start,
          },
        },
        update: {},
        create: {
          centreId,
          date,
          startTime: ts.start,
          endTime: ts.end,
          capacity: slotCapacity,
          availableQuantity: slotCapacity,
          reservedQuantity: 0,
          bookedFarmerCount: 0,
          slotStatus: 'AVAILABLE',
        },
      });
      createdSlots.push(slot);
    }

    return sendSuccess(res, createdSlots, `Generated ${createdSlots.length} slots for ${date}`);
  },
};
