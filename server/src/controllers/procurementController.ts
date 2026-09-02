import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { sendPaginated, sendSuccess, sendError } from '../utils/response';

export const procurementController = {
  async listProcurements(req: Request, res: Response) {
    const { centreId, crop, farmerId, page = '1', limit = '10' } = req.query;

    const pageNum = parseInt(String(page), 10) || 1;
    const limitNum = parseInt(String(limit), 10) || 10;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (centreId) where.centreId = String(centreId);
    if (crop) where.crop = String(crop);
    if (farmerId) where.farmerId = String(farmerId);

    const [total, records] = await Promise.all([
      prisma.procurementRecord.count({ where }),
      prisma.procurementRecord.findMany({
        where,
        include: {
          farmer: {
            select: {
              farmerId: true,
              fullName: true,
              mobileNumber: true,
              village: true,
              district: true,
            },
          },
          centre: {
            select: {
              centreCode: true,
              name: true,
            },
          },
          payment: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
    ]);

    return sendPaginated(res, records, pageNum, limitNum, total);
  },

  async getProcurementById(req: Request, res: Response) {
    const { id } = req.params;

    const record = await prisma.procurementRecord.findUnique({
      where: { procurementId: id },
      include: {
        farmer: true,
        centre: true,
        payment: true,
        booking: {
          include: {
            qualityAssay: true,
            weighment: true,
          },
        },
      },
    });

    if (!record) {
      return sendError(res, 'Procurement record not found', 404);
    }

    return sendSuccess(res, record);
  },
};
