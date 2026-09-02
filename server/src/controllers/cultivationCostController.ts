import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { sendSuccess } from '../utils/response';

export const cultivationCostController = {
  async getCosts(req: Request, res: Response) {
    const { crop, season } = req.query;

    const where: any = {};
    if (crop) where.crop = String(crop);
    if (season) where.season = String(season);

    const costs = await prisma.cultivationCost.findMany({
      where,
      orderBy: { percentageChange: 'desc' },
    });

    return sendSuccess(res, costs);
  },
};
