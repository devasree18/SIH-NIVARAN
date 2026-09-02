import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { sendSuccess } from '../utils/response';

export const cropController = {
  async listCrops(_req: Request, res: Response) {
    const crops = await prisma.cropConfiguration.findMany({
      where: { isActive: true },
      orderBy: { cropName: 'asc' },
    });

    const parsed = crops.map((c) => {
      let qualityParams = {};
      try {
        qualityParams = JSON.parse(c.qualityParameters);
      } catch {
        qualityParams = {};
      }
      return {
        ...c,
        parsedQualityParameters: qualityParams,
      };
    });

    return sendSuccess(res, parsed);
  },
};
