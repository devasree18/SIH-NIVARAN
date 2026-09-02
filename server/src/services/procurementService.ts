import { prisma } from '../prisma';
import { auditService } from './auditService';
import { notificationService } from './notificationService';
import { QualityStatus, QualityGrade, QueueStatus, TokenStatus, PaymentStatus } from '../types';

export interface QualityAssayInput {
  tokenId: string;
  officerId: string;
  officerName: string;
  moisturePercentage: number;
  foreignMatterPercentage: number;
  damagedGrainsPercentage: number;
  admixturePercentage?: number;
  attachmentRef?: string;
  notes?: string;
}

export interface WeighmentInput {
  tokenId: string;
  operatorId: string;
  operatorName: string;
  grossWeight: number; // Qtl
  tareWeight: number;  // Qtl
}

export const procurementService = {
  // 1. QUALITY ASSAY
  async recordQualityAssay(input: QualityAssayInput) {
    const booking = await prisma.booking.findUnique({
      where: { tokenId: input.tokenId },
      include: { farmer: true, centre: true },
    });

    if (!booking) {
      throw new Error(`Token #${input.tokenId} not found`);
    }

    // Look up crop configuration to evaluate thresholds
    const cropConfig = await prisma.cropConfiguration.findFirst({
      where: {
        cropName: { equals: booking.crop },
        isActive: true,
      },
    });

    // Default national procurement standards if config not in DB:
    // Wheat: Moisture <= 12%, Foreign matter <= 0.75%, Damaged <= 4%
    // Paddy: Moisture <= 17%, Foreign matter <= 1.0%, Damaged <= 3%
    let maxMoisture = 12.0;
    let maxForeignMatter = 0.75;
    let maxDamaged = 4.0;

    if (cropConfig) {
      try {
        const params = JSON.parse(cropConfig.qualityParameters);
        if (params.maxMoisture) maxMoisture = params.maxMoisture;
        if (params.maxForeignMatter) maxForeignMatter = params.maxForeignMatter;
        if (params.maxDamaged) maxDamaged = params.maxDamaged;
      } catch {
        // use defaults
      }
    }

    let qualityStatus = QualityStatus.PASSED;
    let grade = QualityGrade.GRADE_A;
    const failureReasons: string[] = [];

    if (input.moisturePercentage > maxMoisture) {
      qualityStatus = QualityStatus.FAILED;
      failureReasons.push(`Moisture content (${input.moisturePercentage}%) exceeds acceptable limit (${maxMoisture}%). Produce requires drying.`);
    }

    if (input.foreignMatterPercentage > maxForeignMatter) {
      qualityStatus = QualityStatus.FAILED;
      failureReasons.push(`Foreign matter / dust (${input.foreignMatterPercentage}%) exceeds permissible threshold (${maxForeignMatter}%). Produce requires winnowing.`);
    }

    if (input.damagedGrainsPercentage > maxDamaged) {
      qualityStatus = QualityStatus.FAILED;
      failureReasons.push(`Damaged / shriveled grain (${input.damagedGrainsPercentage}%) exceeds threshold (${maxDamaged}%).`);
    }

    if (qualityStatus === QualityStatus.PASSED) {
      // Grade differentiation
      if (input.moisturePercentage <= maxMoisture - 1 && input.foreignMatterPercentage <= 0.5) {
        grade = QualityGrade.GRADE_A;
      } else {
        grade = QualityGrade.GRADE_B;
      }
    } else {
      grade = QualityGrade.REJECTED;
    }

    const decisionReason = qualityStatus === QualityStatus.PASSED
      ? `Produce verified within permissible parameters (${grade}). Quality certified for procurement.`
      : failureReasons.join(' ');

    const parameterResults = JSON.stringify({
      moisture: input.moisturePercentage,
      foreignMatter: input.foreignMatterPercentage,
      damagedGrains: input.damagedGrainsPercentage,
      admixture: input.admixturePercentage || 0,
      limits: { maxMoisture, maxForeignMatter, maxDamaged },
      notes: input.notes,
    });

    const assay = await prisma.qualityAssay.upsert({
      where: { tokenId: input.tokenId },
      update: {
        qualityOfficerId: input.officerId,
        officerName: input.officerName,
        parameterResults,
        grade,
        qualityStatus,
        decisionReason,
        attachmentRef: input.attachmentRef,
        updatedAt: new Date(),
      },
      create: {
        bookingId: booking.id,
        tokenId: input.tokenId,
        qualityOfficerId: input.officerId,
        officerName: input.officerName,
        parameterResults,
        grade,
        qualityStatus,
        decisionReason,
        attachmentRef: input.attachmentRef,
      },
    });

    // Update booking queue state
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        queueStatus: qualityStatus === QualityStatus.PASSED ? QueueStatus.PROCESSING : QueueStatus.WAITING,
      },
    });

    // Notify farmer
    await notificationService.createNotification({
      recipientId: booking.farmerId,
      category: 'QUALITY',
      title: qualityStatus === QualityStatus.PASSED ? 'Quality Assay Passed' : 'Quality Assay Result: Action Required',
      message: qualityStatus === QualityStatus.PASSED
        ? `Your produce passed quality assay with ${grade}. Please proceed to the weighbridge counter.`
        : `Your produce could not be accepted in current condition: ${decisionReason}`,
      actionUrl: `/farmer/token/${booking.tokenId}`,
      preferredLanguage: booking.farmer.preferredLanguage,
    });

    // Audit log
    await auditService.log({
      actor: input.officerName,
      actorRole: 'QUALITY_OFFICER',
      action: 'QUALITY_ASSAY_RECORDED',
      entityType: 'QualityAssay',
      entityId: assay.id,
      newValue: { grade, qualityStatus, decisionReason },
      reason: 'Standard mandatory grain assay testing',
    });

    return assay;
  },

  // 2. WEIGHMENT
  async recordWeighment(input: WeighmentInput) {
    if (input.grossWeight <= 0) {
      throw new Error('Gross weight must be greater than zero.');
    }
    if (input.tareWeight < 0) {
      throw new Error('Tare weight cannot be negative.');
    }
    if (input.grossWeight < input.tareWeight) {
      throw new Error(`Gross weight (${input.grossWeight} Qtl) cannot be less than tare weight (${input.tareWeight} Qtl).`);
    }

    const netWeight = parseFloat((input.grossWeight - input.tareWeight).toFixed(2));
    if (netWeight <= 0) {
      throw new Error('Calculated net weight must be greater than zero.');
    }

    const booking = await prisma.booking.findUnique({
      where: { tokenId: input.tokenId },
      include: {
        farmer: true,
        centre: true,
        qualityAssay: true,
      },
    });

    if (!booking) {
      throw new Error(`Token #${input.tokenId} not found`);
    }

    if (!booking.qualityAssay || booking.qualityAssay.qualityStatus !== QualityStatus.PASSED) {
      throw new Error(`Cannot record weighment. Token #${input.tokenId} has not passed Quality Assay.`);
    }

    // Check if verified net weight exceeds allocated token quantity
    let acceptedQuantity = netWeight;
    let rejectedQuantity = 0.0;
    const allocated = booking.allocatedQuantity;

    let adjustmentNeeded = false;
    let excessQuantity = 0.0;

    if (netWeight > allocated) {
      excessQuantity = parseFloat((netWeight - allocated).toFixed(2));
      adjustmentNeeded = true;
      acceptedQuantity = allocated; // initially accept up to allocated, excess awaits approval
    }

    const weighment = await prisma.weighment.upsert({
      where: { tokenId: input.tokenId },
      update: {
        weighmentOperatorId: input.operatorId,
        operatorName: input.operatorName,
        grossWeight: input.grossWeight,
        tareWeight: input.tareWeight,
        netWeight,
        acceptedQuantity,
        rejectedQuantity,
        updatedAt: new Date(),
      },
      create: {
        bookingId: booking.id,
        tokenId: input.tokenId,
        weighmentOperatorId: input.operatorId,
        operatorName: input.operatorName,
        grossWeight: input.grossWeight,
        tareWeight: input.tareWeight,
        netWeight,
        acceptedQuantity,
        rejectedQuantity,
      },
    });

    // If excess quantity detected, create a QuantityAdjustmentRequest for Centre Manager approval
    let adjustmentRequest = null;
    if (adjustmentNeeded) {
      // Check remaining centre capacity
      const centre = booking.centre;
      const capacityCheckResult = centre.dailyCapacity > 0 ? 'WITHIN_CAPACITY' : 'EXCEEDS_CAPACITY';

      adjustmentRequest = await prisma.quantityAdjustmentRequest.upsert({
        where: { tokenId: input.tokenId },
        update: {
          originalTokenQuantity: allocated,
          verifiedQuantity: netWeight,
          additionalRequestedQuantity: excessQuantity,
          capacityCheckResult,
          approvalStatus: 'PENDING',
          reason: `Delivered weight (${netWeight} Qtl) exceeds booked token allocation (${allocated} Qtl) by ${excessQuantity} Qtl.`,
        },
        create: {
          bookingId: booking.id,
          tokenId: input.tokenId,
          originalTokenQuantity: allocated,
          verifiedQuantity: netWeight,
          additionalRequestedQuantity: excessQuantity,
          capacityCheckResult,
          approvalStatus: 'PENDING',
          reason: `Delivered weight (${netWeight} Qtl) exceeds booked token allocation (${allocated} Qtl) by ${excessQuantity} Qtl.`,
        },
      });

      // Notify Centre Manager and Farmer
      await notificationService.createNotification({
        recipientId: booking.farmerId,
        category: 'WEIGHMENT',
        title: 'Excess Quantity Detected - Approval Pending',
        message: `Your net weight is ${netWeight} Qtl (Booked: ${allocated} Qtl). An additional procurement request for ${excessQuantity} Qtl has been forwarded to Centre Manager for capacity approval.`,
        actionUrl: `/farmer/token/${booking.tokenId}`,
        preferredLanguage: booking.farmer.preferredLanguage,
      });

      await auditService.log({
        actor: input.operatorName,
        actorRole: 'WEIGHMENT_OPERATOR',
        action: 'EXCESS_QUANTITY_DETECTED',
        entityType: 'QuantityAdjustmentRequest',
        entityId: adjustmentRequest.id,
        newValue: { original: allocated, netWeight, excess: excessQuantity },
        reason: 'Net weight exceeds allocated token capacity',
      });
    } else {
      // If no excess, proceed directly to finalize procurement
      await this.finalizeProcurementRecord(input.tokenId, acceptedQuantity);
    }

    await auditService.log({
      actor: input.operatorName,
      actorRole: 'WEIGHMENT_OPERATOR',
      action: 'WEIGHMENT_RECORDED',
      entityType: 'Weighment',
      entityId: weighment.id,
      newValue: { grossWeight: input.grossWeight, tareWeight: input.tareWeight, netWeight, acceptedQuantity },
      reason: 'Certified weighbridge measurement recorded',
    });

    return { weighment, adjustmentRequest };
  },

  // 3. QUANTITY ADJUSTMENT APPROVAL (Manager Only)
  async approveQuantityAdjustment(adjustmentId: string, managerName: string, approved: boolean, reason: string) {
    const adjustment = await prisma.quantityAdjustmentRequest.findUnique({
      where: { id: adjustmentId },
      include: {
        booking: {
          include: { farmer: true, centre: true },
        },
      },
    });

    if (!adjustment) {
      throw new Error('Quantity adjustment request not found');
    }

    const booking = adjustment.booking;
    const finalProcuredQuantity = approved ? adjustment.verifiedQuantity : adjustment.originalTokenQuantity;
    const additionalQuantity = approved ? adjustment.additionalRequestedQuantity : 0.0;

    const updated = await prisma.quantityAdjustmentRequest.update({
      where: { id: adjustmentId },
      data: {
        approvalStatus: approved ? 'APPROVED' : 'REJECTED',
        approvedBy: managerName,
        approvedAt: new Date(),
        reason: `${reason} (Decision by ${managerName})`,
      },
    });

    // Update weighment accepted quantity
    await prisma.weighment.update({
      where: { tokenId: booking.tokenId },
      data: {
        acceptedQuantity: finalProcuredQuantity,
        rejectedQuantity: approved ? 0.0 : adjustment.additionalRequestedQuantity,
      },
    });

    // Finalize procurement record
    await this.finalizeProcurementRecord(booking.tokenId, finalProcuredQuantity, additionalQuantity);

    // Notify farmer
    await notificationService.createNotification({
      recipientId: booking.farmerId,
      category: 'WEIGHMENT',
      title: approved ? 'Additional Quantity Approved' : 'Additional Quantity Not Accepted',
      message: approved
        ? `Centre Manager approved additional ${adjustment.additionalRequestedQuantity} Qtl. Total accepted quantity: ${finalProcuredQuantity} Qtl.`
        : `Centre Manager could not approve excess quantity (${reason}). Procured quantity confirmed at ${finalProcuredQuantity} Qtl.`,
      actionUrl: `/farmer/token/${booking.tokenId}`,
      preferredLanguage: booking.farmer.preferredLanguage,
    });

    // Audit log
    await auditService.log({
      actor: managerName,
      actorRole: 'CENTRE_MANAGER',
      action: approved ? 'APPROVE_QUANTITY_ADJUSTMENT' : 'REJECT_QUANTITY_ADJUSTMENT',
      entityType: 'QuantityAdjustmentRequest',
      entityId: adjustmentId,
      oldValue: { status: 'PENDING' },
      newValue: { status: approved ? 'APPROVED' : 'REJECTED', finalProcuredQuantity },
      reason,
    });

    return updated;
  },

  // 4. FINALIZE PROCUREMENT & GENERATE PAYMENT
  async finalizeProcurementRecord(tokenId: string, acceptedQty?: number, additionalQty = 0.0) {
    const booking = await prisma.booking.findUnique({
      where: { tokenId },
      include: {
        farmer: true,
        centre: true,
        weighment: true,
      },
    });

    if (!booking) throw new Error(`Token #${tokenId} not found`);

    const finalQty = acceptedQty ?? (booking.weighment ? booking.weighment.acceptedQuantity : booking.allocatedQuantity);

    // Look up MSP rate for crop
    const cropConfig = await prisma.cropConfiguration.findFirst({
      where: { cropName: { equals: booking.crop }, isActive: true },
    });

    const applicableRate = cropConfig ? cropConfig.procurementRatePerUnit : 2425.0; // Standard fallback rate
    const payableAmount = parseFloat((finalQty * applicableRate).toFixed(2));

    const procurementId = `PRC-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;

    const procurement = await prisma.procurementRecord.upsert({
      where: { tokenId },
      update: {
        acceptedQuantity: finalQty,
        finalProcuredQuantity: finalQty,
        additionalQuantity: additionalQty,
        payableAmount,
        procurementStatus: 'CONFIRMED',
      },
      create: {
        procurementId,
        farmerId: booking.farmerId,
        tokenId: booking.tokenId,
        bookingId: booking.id,
        crop: booking.crop,
        centreId: booking.centreId,
        expectedQuantity: booking.requestedQuantity,
        actualDeliveredQuantity: booking.weighment ? booking.weighment.netWeight : finalQty,
        acceptedQuantity: finalQty,
        additionalQuantity: additionalQty,
        finalProcuredQuantity: finalQty,
        applicableRate,
        payableAmount,
        procurementStatus: 'CONFIRMED',
      },
    });

    // Mark QueueEntry and Booking as COMPLETED
    await prisma.queueEntry.update({
      where: { bookingId: booking.id },
      data: {
        status: QueueStatus.COMPLETED,
        completionTime: new Date(),
      },
    });

    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        queueStatus: QueueStatus.COMPLETED,
        tokenStatus: TokenStatus.USED,
      },
    });

    // Automatically generate Payment record for Finance Officer
    const paymentId = `PAY-${Date.now().toString().slice(-6)}-${Math.floor(1000 + Math.random() * 9000)}`;
    const expectedProcessingDate = new Date();
    expectedProcessingDate.setDate(expectedProcessingDate.getDate() + 2); // Standard 48-hour DBT settlement timeline

    const payment = await prisma.payment.upsert({
      where: { procurementId: procurement.procurementId },
      update: {
        payableAmount,
      },
      create: {
        paymentId,
        procurementId: procurement.procurementId,
        farmerId: booking.farmerId,
        payableAmount,
        status: PaymentStatus.INITIATED,
        bankAccountMasked: booking.farmer.accountNumberMasked,
        ifscCode: booking.farmer.ifscCode,
        expectedProcessingDate,
      },
    });

    // Notify farmer of procurement confirmation & expected payment
    await notificationService.createNotification({
      recipientId: booking.farmerId,
      category: 'PAYMENT',
      title: 'Procurement Confirmed & Payment Initiated',
      message: `Procurement of ${finalQty} Qtl ${booking.crop} confirmed. Total payable: ₹${payableAmount.toLocaleString('en-IN')}. Direct Benefit Transfer (DBT) scheduled within 48 hours to account ${booking.farmer.accountNumberMasked}.`,
      actionUrl: `/farmer/token/${booking.tokenId}`,
      preferredLanguage: booking.farmer.preferredLanguage,
    });

    return { procurement, payment };
  },
};
