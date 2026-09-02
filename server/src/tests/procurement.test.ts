import { describe, it, expect, beforeAll, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../index';
import { prisma } from '../prisma';
import { slotAllocationService } from '../services/slotAllocationService';
import { tokenProtectionService } from '../services/tokenProtectionService';
import { procurementService } from '../services/procurementService';

describe('SIH-NIVARAN Procurement Management Test Suite', () => {
  let farmerToken: string;
  let adminToken: string;
  let centreId: string;
  let counter = 10;

  beforeAll(async () => {
    // Acquire auth tokens using the demo accounts
    const resFarmer = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'farmer_ramesh', password: 'password123' });
    farmerToken = resFarmer.body.data.token;

    const resAdmin = await request(app)
      .post('/api/v1/auth/login')
      .send({ username: 'admin_sharma', password: 'password123' });
    adminToken = resAdmin.body.data.token;

    const centre = await prisma.procurementCentre.findFirst();
    centreId = centre!.id;
  });

  const getUniqueDate = () => {
    counter++;
    const day = String((counter % 18) + 10).padStart(2, '0');
    return `2026-11-${day}`;
  };

  // 1. Farmer Registration & Duplicate Prevention
  it('1. Rejects farmer registration with duplicate mobile number or username', async () => {
    const duplicateRes = await request(app)
      .post('/api/v1/auth/register')
      .send({
        username: 'farmer_ramesh', // already exists
        password: 'password123',
        fullName: 'Another Ramesh',
        mobileNumber: '9876543210', // already exists
        address: 'Some address',
        district: 'Karnal',
        village: 'Taraori',
        landDetails: { acreage: 5, surveyNumber: 'SY-11', irrigationType: 'Canal' },
        bankName: 'SBI',
        accountNumber: '1234567890',
        ifscCode: 'SBIN0001234',
      });

    expect(duplicateRes.status).toBe(409);
    expect(duplicateRes.body.success).toBe(false);
  });

  // 2. Slot Capacity Over-Allocation Prevention
  it('2. Prevents booking when requested quantity exceeds available slot capacity', async () => {
    const testDate = getUniqueDate();
    const smallSlot = await prisma.slot.upsert({
      where: {
        centreId_date_startTime: {
          centreId,
          date: testDate,
          startTime: '14:00',
        },
      },
      update: {
        capacity: 20.0,
        availableQuantity: 20.0,
        reservedQuantity: 0.0,
        bookedFarmerCount: 0,
        slotStatus: 'AVAILABLE',
      },
      create: {
        centreId,
        date: testDate,
        startTime: '14:00',
        endTime: '15:00',
        capacity: 20.0,
        availableQuantity: 20.0,
        reservedQuantity: 0.0,
        bookedFarmerCount: 0,
        slotStatus: 'AVAILABLE',
      },
    });

    await expect(
      slotAllocationService.bookSlot({
        farmerId: 'FARMER-PB-2026-102',
        centreId,
        crop: 'Wheat',
        requestedQuantity: 50.0, // Exceeds 20 Qtl
        preferredDate: testDate,
        slotId: smallSlot.id,
      })
    ).rejects.toThrow(/Insufficient slot capacity/);
  });

  // 3. Concurrency Protection
  it('3. Protects against concurrent booking race conditions', async () => {
    const raceDate = getUniqueDate();
    const raceSlot = await prisma.slot.upsert({
      where: {
        centreId_date_startTime: {
          centreId,
          date: raceDate,
          startTime: '09:00',
        },
      },
      update: {
        capacity: 30.0,
        availableQuantity: 30.0,
        reservedQuantity: 0.0,
        bookedFarmerCount: 0,
        slotStatus: 'AVAILABLE',
      },
      create: {
        centreId,
        date: raceDate,
        startTime: '09:00',
        endTime: '10:00',
        capacity: 30.0,
        availableQuantity: 30.0,
        reservedQuantity: 0.0,
        bookedFarmerCount: 0,
        slotStatus: 'AVAILABLE',
      },
    });

    // Create 3 isolated test farmers
    const farmers = [];
    for (let i = 1; i <= 3; i++) {
      const fId = `FARMER-ISO-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 5)}`;
      const f = await prisma.farmer.create({
        data: {
          farmerId: fId,
          fullName: `Concurrency Farmer ${i}`,
          mobileNumber: `96${Math.floor(10000000 + Math.random() * 90000000)}`,
          address: 'Test',
          district: 'Karnal',
          village: 'Test',
          landDetails: '{}',
          bankName: 'SBI',
          accountNumberMasked: 'XXXXXXXX1111',
          ifscCode: 'SBIN0001234',
        },
      });
      farmers.push(f);
    }

    // Each farmer attempts to reserve 20 Qtl simultaneously on the 30 Qtl slot
    const attempts = farmers.map((f) =>
      slotAllocationService
        .bookSlot({
          farmerId: f.farmerId,
          centreId,
          crop: 'Wheat',
          requestedQuantity: 20.0,
          preferredDate: raceDate,
          slotId: raceSlot.id,
        })
        .then((res) => ({ status: 'fulfilled', res }))
        .catch((err) => ({ status: 'rejected', err }))
    );

    const results = await Promise.all(attempts);
    const fulfilled = results.filter((r) => r.status === 'fulfilled');
    const rejected = results.filter((r) => r.status === 'rejected');

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(2);

    // Verify slot in DB was not over-allocated
    const finalSlot = await prisma.slot.findUnique({ where: { id: raceSlot.id } });
    expect(finalSlot!.reservedQuantity).toBe(20.0);
    expect(finalSlot!.availableQuantity).toBe(10.0);
  });

  // 4. Duplicate Active Booking Prevention
  it('4. Prevents a farmer from creating duplicate active bookings on the same date', async () => {
    const dupDate = getUniqueDate();
    const testFarmer = await prisma.farmer.create({
      data: {
        farmerId: `FARMER-DUP-${Date.now()}`,
        fullName: 'Dup Farmer',
        mobileNumber: `95${Math.floor(10000000 + Math.random() * 90000000)}`,
        address: 'Test',
        district: 'Karnal',
        village: 'Test',
        landDetails: '{}',
        bankName: 'SBI',
        accountNumberMasked: 'XXXXXXXX1111',
        ifscCode: 'SBIN0001234',
      },
    });

    // Create isolated slot
    await prisma.slot.upsert({
      where: {
        centreId_date_startTime: {
          centreId,
          date: dupDate,
          startTime: '10:00',
        },
      },
      update: {
        capacity: 100.0,
        availableQuantity: 100.0,
        reservedQuantity: 0.0,
        bookedFarmerCount: 0,
        slotStatus: 'AVAILABLE',
      },
      create: {
        centreId,
        date: dupDate,
        startTime: '10:00',
        endTime: '11:00',
        capacity: 100.0,
        availableQuantity: 100.0,
        reservedQuantity: 0.0,
        bookedFarmerCount: 0,
        slotStatus: 'AVAILABLE',
      },
    });

    // First booking
    await slotAllocationService.bookSlot({
      farmerId: testFarmer.farmerId,
      centreId,
      crop: 'Wheat',
      requestedQuantity: 25.0,
      preferredDate: dupDate,
    });

    // Attempt second booking for same farmer on same date
    await expect(
      slotAllocationService.bookSlot({
        farmerId: testFarmer.farmerId,
        centreId,
        crop: 'Wheat',
        requestedQuantity: 20.0,
        preferredDate: dupDate,
      })
    ).rejects.toThrow(/Farmer already has an active booking/);
  });

  // 5. Weighment Validation (gross < tare rejected)
  it('5. Rejects weighment where gross weight is less than tare weight', async () => {
    await expect(
      procurementService.recordWeighment({
        tokenId: 'TKN-KNL-01-001',
        operatorId: 'OP-1',
        operatorName: 'Vikram',
        grossWeight: 40.0,
        tareWeight: 45.0, // Gross < Tare!
      })
    ).rejects.toThrow(/cannot be less than tare weight/);
  });

  // 6. Token Protection & Delay Validity Extension
  it('6. Automatically extends active token validity when centre delay is recorded', async () => {
    const delayDate = getUniqueDate();
    const delayFarmer = await prisma.farmer.create({
      data: {
        farmerId: `FARMER-DELAY-${Date.now()}`,
        fullName: 'Delay Farmer',
        mobileNumber: `94${Math.floor(10000000 + Math.random() * 90000000)}`,
        address: 'Test',
        district: 'Karnal',
        village: 'Test',
        landDetails: '{}',
        bankName: 'SBI',
        accountNumberMasked: 'XXXXXXXX1111',
        ifscCode: 'SBIN0001234',
      },
    });

    const slot = await prisma.slot.upsert({
      where: {
        centreId_date_startTime: {
          centreId,
          date: delayDate,
          startTime: '11:00',
        },
      },
      update: {
        capacity: 60.0,
        availableQuantity: 60.0,
        reservedQuantity: 0.0,
        bookedFarmerCount: 0,
        slotStatus: 'AVAILABLE',
      },
      create: {
        centreId,
        date: delayDate,
        startTime: '11:00',
        endTime: '12:00',
        capacity: 60.0,
        availableQuantity: 60.0,
        reservedQuantity: 0.0,
        bookedFarmerCount: 0,
        slotStatus: 'AVAILABLE',
      },
    });

    // Create a fresh booking
    const { booking } = await slotAllocationService.bookSlot({
      farmerId: delayFarmer.farmerId,
      centreId,
      crop: 'Wheat',
      requestedQuantity: 20.0,
      preferredDate: delayDate,
      slotId: slot.id,
    });

    const oldEnd = new Date(booking.validityEnd).getTime();

    const delayRes = await tokenProtectionService.recordCentreDelay({
      centreId,
      reason: 'MACHINERY_FAILURE',
      description: 'Weighbridge sensor calibration failure',
      delayMinutes: 45,
      authorizedAction: 'EXTEND_VALIDITY',
      createdBy: 'Rajesh Sharma',
      creatorRole: 'CENTRE_MANAGER',
    });

    expect(delayRes.protectedTokensCount).toBeGreaterThan(0);

    const bookingAfter = await prisma.booking.findUnique({
      where: { id: booking.id },
    });
    const newEnd = new Date(bookingAfter!.validityEnd).getTime();

    // Verify 45 minute extension
    expect(newEnd - oldEnd).toBe(45 * 60 * 1000);
    expect(bookingAfter!.tokenStatus).toBe('EXTENDED');
  });

  // 7. Role-Based Access Control (RBAC) Enforcement
  it('7. Enforces backend role security (Farmer cannot record assay or update payments)', async () => {
    // Farmer trying to post quality assay
    const assayRes = await request(app)
      .post('/api/v1/quality/assay')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({
        tokenId: 'TKN-KNL-01-001',
        moisturePercentage: 11.5,
        foreignMatterPercentage: 0.5,
        damagedGrainsPercentage: 2.0,
      });

    expect(assayRes.status).toBe(403);
    expect(assayRes.body.error.code).toBe('FORBIDDEN');

    // Farmer trying to approve payments
    const payRes = await request(app)
      .patch('/api/v1/payments/PAY-2026-9001/status')
      .set('Authorization', `Bearer ${farmerToken}`)
      .send({
        status: 'PAID',
      });

    expect(payRes.status).toBe(403);
    expect(payRes.body.error.code).toBe('FORBIDDEN');
  });

  // 8. Quality Assay Evaluation
  it('8. Evaluates quality parameters and flags failed moisture/foreign matter', async () => {
    // Test with excess moisture (18.5% vs max 12% for Wheat)
    const assay = await procurementService.recordQualityAssay({
      tokenId: 'TKN-KNL-01-002',
      officerId: 'QO-01',
      officerName: 'Dr. Anita Roy',
      moisturePercentage: 18.5,
      foreignMatterPercentage: 0.5,
      damagedGrainsPercentage: 2.0,
    });

    expect(assay.grade).toBe('REJECTED');
    expect(assay.qualityStatus).toBe('FAILED');
    expect(assay.decisionReason).toContain('Moisture content (18.5%) exceeds acceptable limit');
  });

  // 9. Payment Calculation Formula
  it('9. Accurately calculates payableAmount = acceptedQuantity * applicableRate', async () => {
    const result = await procurementService.finalizeProcurementRecord('TKN-KNL-01-001', 50.0);

    expect(result.procurement.finalProcuredQuantity).toBe(50.0);
    expect(result.procurement.applicableRate).toBe(2425.0);
    expect(result.procurement.payableAmount).toBe(50.0 * 2425.0); // 1,21,250
    expect(result.payment.payableAmount).toBe(121250.0);
    expect(result.payment.status).toBe('INITIATED');
  });

  // 10. Audit Trail Creation
  it('10. Creates an immutable audit log for administrative modifications', async () => {
    const logs = await prisma.auditLog.findMany({
      where: { action: 'TOKEN_PROTECTION_EXTENSION' },
    });

    expect(logs.length).toBeGreaterThan(0);
    expect(logs[0].actorRole).toBe('CENTRE_MANAGER');
  });
});
