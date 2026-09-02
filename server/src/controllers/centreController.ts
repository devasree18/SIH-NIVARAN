import { Request, Response } from 'express';
import { prisma } from '../prisma';
import { sendSuccess, sendError } from '../utils/response';
import { congestionService } from '../services/congestionService';
import { auditService } from '../services/auditService';

export const centreController = {
  async listCentres(req: Request, res: Response) {
    const { district, crop } = req.query;

    const where: any = {};
    if (district) where.district = String(district);

    const centres = await prisma.procurementCentre.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    // Attach real-time congestion indicators
    const centresWithCongestion = await Promise.all(
      centres.map(async (c) => {
        const congestion = await congestionService.calculateCentreCongestion(c.id);
        let supported = [];
        try {
          supported = JSON.parse(c.cropsSupported);
        } catch {
          supported = [c.cropsSupported];
        }

        return {
          ...c,
          cropsSupportedList: supported,
          congestion,
        };
      })
    );

    // Filter by crop if requested
    const filtered = crop
      ? centresWithCongestion.filter((c) =>
          c.cropsSupportedList.some((cropName: string) =>
            cropName.toLowerCase().includes(String(crop).toLowerCase())
          )
        )
      : centresWithCongestion;

    return sendSuccess(res, filtered);
  },

  async getCentreById(req: Request, res: Response) {
    const { id } = req.params;

    const centre = await prisma.procurementCentre.findUnique({
      where: { id },
    });

    if (!centre) {
      return sendError(res, 'Procurement centre not found', 404, 'NOT_FOUND');
    }

    const congestion = await congestionService.calculateCentreCongestion(id);

    return sendSuccess(res, {
      ...centre,
      congestion,
    });
  },

  async updateCentreStatus(req: Request, res: Response) {
    const { id } = req.params;
    const { operationalStatus, activeCounters, weighbridgeAvailability, operatorAvailability, dailyCapacity } = req.body;

    const centre = await prisma.procurementCentre.findUnique({
      where: { id },
    });

    if (!centre) {
      return sendError(res, 'Procurement centre not found', 404, 'NOT_FOUND');
    }

    const updated = await prisma.procurementCentre.update({
      where: { id },
      data: {
        operationalStatus: operationalStatus || centre.operationalStatus,
        activeCounters: activeCounters !== undefined ? activeCounters : centre.activeCounters,
        weighbridgeAvailability: weighbridgeAvailability !== undefined ? weighbridgeAvailability : centre.weighbridgeAvailability,
        operatorAvailability: operatorAvailability !== undefined ? operatorAvailability : centre.operatorAvailability,
        dailyCapacity: dailyCapacity !== undefined ? dailyCapacity : centre.dailyCapacity,
      },
    });

    await auditService.log({
      actor: req.user?.username || 'Admin',
      actorRole: req.user?.role || 'CENTRE_MANAGER',
      action: 'CENTRE_STATUS_MODIFIED',
      entityType: 'ProcurementCentre',
      entityId: id,
      oldValue: {
        status: centre.operationalStatus,
        counters: centre.activeCounters,
        weighbridge: centre.weighbridgeAvailability,
      },
      newValue: {
        status: updated.operationalStatus,
        counters: updated.activeCounters,
        weighbridge: updated.weighbridgeAvailability,
      },
      reason: 'Administrative centre configuration update',
    });

    return sendSuccess(res, updated, 'Centre operational parameters updated successfully');
  },
};
