import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding SIH-NIVARAN database with realistic procurement data...');

  const passwordHash = await bcrypt.hash('password123', 10);

  // 1. CROP CONFIGURATIONS (Official MSP & Quality Parameters)
  const crops = [
    {
      cropCode: 'WHEAT-RABI-2026',
      cropName: 'Wheat',
      season: 'Rabi 2025-26',
      procurementRatePerUnit: 2425.0,
      quantityUnit: 'Quintal',
      qualityParameters: JSON.stringify({
        maxMoisture: 12.0,
        maxForeignMatter: 0.75,
        maxDamaged: 4.0,
        minProtein: 10.0,
      }),
      isActive: true,
    },
    {
      cropCode: 'PADDY-KHARIF-2026',
      cropName: 'Paddy',
      season: 'Kharif 2025-26',
      procurementRatePerUnit: 2320.0,
      quantityUnit: 'Quintal',
      qualityParameters: JSON.stringify({
        maxMoisture: 17.0,
        maxForeignMatter: 1.0,
        maxDamaged: 3.0,
      }),
      isActive: true,
    },
    {
      cropCode: 'MUSTARD-RABI-2026',
      cropName: 'Mustard',
      season: 'Rabi 2025-26',
      procurementRatePerUnit: 5650.0,
      quantityUnit: 'Quintal',
      qualityParameters: JSON.stringify({
        maxMoisture: 8.0,
        maxForeignMatter: 1.5,
        maxDamaged: 2.0,
      }),
      isActive: true,
    },
    {
      cropCode: 'CHANA-RABI-2026',
      cropName: 'Gram (Chana)',
      season: 'Rabi 2025-26',
      procurementRatePerUnit: 5440.0,
      quantityUnit: 'Quintal',
      qualityParameters: JSON.stringify({
        maxMoisture: 10.0,
        maxForeignMatter: 1.0,
        maxDamaged: 3.0,
      }),
      isActive: true,
    },
  ];

  for (const c of crops) {
    await prisma.cropConfiguration.upsert({
      where: { cropCode: c.cropCode },
      update: c,
      create: c,
    });
  }

  // 2. PROCUREMENT CENTRES
  const centresData = [
    {
      centreCode: 'KNL-MANDI-01',
      name: 'Karnal Central Mandi Hub',
      address: 'Near GT Road, New Grain Market, Karnal, Haryana',
      district: 'Karnal',
      cropsSupported: JSON.stringify(['Wheat', 'Paddy', 'Mustard']),
      operatingHours: '08:00 - 18:00',
      dailyCapacity: 800.0,
      slotCapacity: 60.0,
      activeCounters: 4,
      weighbridgeAvailability: true,
      operatorAvailability: true,
      averageServiceMinutes: 14,
      operationalStatus: 'OPEN',
    },
    {
      centreCode: 'KHN-GRAIN-02',
      name: 'Khanna Asia Grain Terminal',
      address: 'Main Mandi Complex, Khanna, Ludhiana, Punjab',
      district: 'Ludhiana',
      cropsSupported: JSON.stringify(['Wheat', 'Paddy']),
      operatingHours: '07:30 - 19:00',
      dailyCapacity: 1200.0,
      slotCapacity: 75.0,
      activeCounters: 6,
      weighbridgeAvailability: true,
      operatorAvailability: true,
      averageServiceMinutes: 12,
      operationalStatus: 'OPEN',
    },
    {
      centreCode: 'KRK-APMC-03',
      name: 'Kurukshetra APMC Complex',
      address: 'Pipli Road, Thanesar, Kurukshetra, Haryana',
      district: 'Kurukshetra',
      cropsSupported: JSON.stringify(['Wheat', 'Mustard', 'Gram (Chana)']),
      operatingHours: '08:30 - 17:30',
      dailyCapacity: 600.0,
      slotCapacity: 50.0,
      activeCounters: 3,
      weighbridgeAvailability: true,
      operatorAvailability: true,
      averageServiceMinutes: 16,
      operationalStatus: 'OPEN',
    },
    {
      centreCode: 'SRS-AGRI-04',
      name: 'Sirsa Modern Procurement Centre',
      address: 'Bhaudhadur Road, Sirsa, Haryana',
      district: 'Sirsa',
      cropsSupported: JSON.stringify(['Wheat', 'Mustard']),
      operatingHours: '08:00 - 17:00',
      dailyCapacity: 500.0,
      slotCapacity: 45.0,
      activeCounters: 3,
      weighbridgeAvailability: true,
      operatorAvailability: true,
      averageServiceMinutes: 15,
      operationalStatus: 'LIMITED',
    },
  ];

  const centres: any[] = [];
  for (const cd of centresData) {
    const c = await prisma.procurementCentre.upsert({
      where: { centreCode: cd.centreCode },
      update: cd,
      create: cd,
    });
    centres.push(c);
  }

  const karnalCentre = centres[0];

  // 3. FARMERS & LINKED USERS
  const farmersData = [
    {
      farmerId: 'FARMER-HR-2026-101',
      fullName: 'Ramesh Kumar Chaudhary',
      mobileNumber: '9876543210',
      preferredLanguage: 'hi',
      address: 'H.No 42, Village Taraori',
      district: 'Karnal',
      village: 'Taraori',
      landDetails: JSON.stringify({ acreage: 8.5, surveyNumber: 'SY-401/B', irrigationType: 'Tubewell / Canal' }),
      bankName: 'State Bank of India',
      accountNumberMasked: 'XXXXXXXX4821',
      ifscCode: 'SBIN0001234',
      preferredProcurementCentre: karnalCentre.id,
      username: 'farmer_ramesh',
    },
    {
      farmerId: 'FARMER-PB-2026-102',
      fullName: 'Sardar Gurpreet Singh Gill',
      mobileNumber: '9812345678',
      preferredLanguage: 'pb',
      address: 'VPO Samrala',
      district: 'Ludhiana',
      village: 'Samrala',
      landDetails: JSON.stringify({ acreage: 14.0, surveyNumber: 'PB-912/C', irrigationType: 'Canal Irrigated' }),
      bankName: 'Punjab National Bank',
      accountNumberMasked: 'XXXXXXXX9934',
      ifscCode: 'PUNB0054321',
      preferredProcurementCentre: centres[1].id,
      username: 'farmer_gurpreet',
    },
    {
      farmerId: 'FARMER-HR-2026-103',
      fullName: 'Baldev Singh Dhillon',
      mobileNumber: '9899887766',
      preferredLanguage: 'en',
      address: 'Village Nilokheri',
      district: 'Karnal',
      village: 'Nilokheri',
      landDetails: JSON.stringify({ acreage: 6.0, surveyNumber: 'SY-203/A', irrigationType: 'Solar Tubewell' }),
      bankName: 'HDFC Bank',
      accountNumberMasked: 'XXXXXXXX3102',
      ifscCode: 'HDFC0000456',
      preferredProcurementCentre: karnalCentre.id,
      username: 'farmer_baldev',
    },
  ];

  for (const f of farmersData) {
    const farmer = await prisma.farmer.upsert({
      where: { farmerId: f.farmerId },
      update: {
        fullName: f.fullName,
        mobileNumber: f.mobileNumber,
        preferredLanguage: f.preferredLanguage,
        address: f.address,
        district: f.district,
        village: f.village,
        landDetails: f.landDetails,
        bankName: f.bankName,
        accountNumberMasked: f.accountNumberMasked,
        ifscCode: f.ifscCode,
        preferredProcurementCentre: f.preferredProcurementCentre,
      },
      create: {
        farmerId: f.farmerId,
        fullName: f.fullName,
        mobileNumber: f.mobileNumber,
        preferredLanguage: f.preferredLanguage,
        address: f.address,
        district: f.district,
        village: f.village,
        landDetails: f.landDetails,
        bankName: f.bankName,
        accountNumberMasked: f.accountNumberMasked,
        ifscCode: f.ifscCode,
        preferredProcurementCentre: f.preferredProcurementCentre,
      },
    });

    await prisma.user.upsert({
      where: { username: f.username },
      update: {
        fullName: f.fullName,
        mobileNumber: f.mobileNumber,
        role: 'FARMER',
        farmerId: farmer.farmerId,
      },
      create: {
        username: f.username,
        passwordHash,
        fullName: f.fullName,
        mobileNumber: f.mobileNumber,
        role: 'FARMER',
        farmerId: farmer.farmerId,
      },
    });
  }

  // 4. USERS FOR OPERATOR, ADMIN, QUALITY, WEIGHMENT, FINANCE ROLES
  const roleUsers = [
    {
      username: 'operator_karnal',
      fullName: 'Suresh Verma (Queue Operator)',
      mobileNumber: '9111111111',
      role: 'CENTRE_OPERATOR',
      centreId: karnalCentre.id,
    },
    {
      username: 'admin_sharma',
      fullName: 'Rajesh Sharma (Centre Manager)',
      mobileNumber: '9222222222',
      role: 'CENTRE_MANAGER',
      centreId: karnalCentre.id,
    },
    {
      username: 'quality_dr_anita',
      fullName: 'Dr. Anita Roy (Assay Officer)',
      mobileNumber: '9333333333',
      role: 'QUALITY_OFFICER',
      centreId: karnalCentre.id,
    },
    {
      username: 'weigh_vikram',
      fullName: 'Vikram Chawla (Weighbridge Incharge)',
      mobileNumber: '9444444444',
      role: 'WEIGHMENT_OPERATOR',
      centreId: karnalCentre.id,
    },
    {
      username: 'finance_neha',
      fullName: 'Neha Gupta (PFMS Nodal Officer)',
      mobileNumber: '9555555555',
      role: 'FINANCE_OFFICER',
      centreId: null,
    },
  ];

  for (const ru of roleUsers) {
    await prisma.user.upsert({
      where: { username: ru.username },
      update: {
        fullName: ru.fullName,
        mobileNumber: ru.mobileNumber,
        role: ru.role,
        centreId: ru.centreId,
      },
      create: {
        username: ru.username,
        passwordHash,
        fullName: ru.fullName,
        mobileNumber: ru.mobileNumber,
        role: ru.role,
        centreId: ru.centreId,
      },
    });
  }

  // 5. SLOTS FOR TODAY AND TOMORROW
  const today = new Date();
  const todayStr = today.toISOString().split('T')[0];

  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const timeWindows = [
    { start: '08:00', end: '09:30' },
    { start: '09:30', end: '11:00' },
    { start: '11:00', end: '12:30' },
    { start: '13:30', end: '15:00' },
    { start: '15:00', end: '16:30' },
    { start: '16:30', end: '18:00' },
  ];

  for (const c of centres) {
    for (const d of [todayStr, tomorrowStr]) {
      for (const tw of timeWindows) {
        await prisma.slot.upsert({
          where: {
            centreId_date_startTime: {
              centreId: c.id,
              date: d,
              startTime: tw.start,
            },
          },
          update: {},
          create: {
            centreId: c.id,
            date: d,
            startTime: tw.start,
            endTime: tw.end,
            capacity: c.slotCapacity,
            availableQuantity: c.slotCapacity,
            reservedQuantity: 0,
            bookedFarmerCount: 0,
            slotStatus: 'AVAILABLE',
          },
        });
      }
    }
  }

  // 6. CULTIVATION COSTS (CACP & State Agriculture Directorate)
  const costItems = [
    {
      location: 'Haryana',
      season: 'Rabi 2025-26',
      crop: 'Wheat',
      category: 'DIESEL',
      baselineCost: 3100.0,
      currentCost: 3380.0,
      percentageChange: 9.03,
      source: 'State Petroleum & Energy Board',
    },
    {
      location: 'Haryana',
      season: 'Rabi 2025-26',
      crop: 'Wheat',
      category: 'FERTILIZER',
      baselineCost: 2800.0,
      currentCost: 2950.0,
      percentageChange: 5.36,
      source: 'IFFCO Subsidy Portal',
    },
    {
      location: 'Haryana',
      season: 'Rabi 2025-26',
      crop: 'Wheat',
      category: 'LABOUR',
      baselineCost: 4500.0,
      currentCost: 5100.0,
      percentageChange: 13.33,
      source: 'District Rural Labour Survey',
    },
    {
      location: 'Haryana',
      season: 'Rabi 2025-26',
      crop: 'Wheat',
      category: 'SEEDS',
      baselineCost: 1950.0,
      currentCost: 2100.0,
      percentageChange: 7.69,
      source: 'Haryana Seeds Development Corp',
    },
    {
      location: 'Haryana',
      season: 'Rabi 2025-26',
      crop: 'Wheat',
      category: 'MACHINERY',
      baselineCost: 3400.0,
      currentCost: 3650.0,
      percentageChange: 7.35,
      source: 'Custom Hiring Centre Rate Card',
    },
    {
      location: 'Haryana',
      season: 'Rabi 2025-26',
      crop: 'Wheat',
      category: 'IRRIGATION',
      baselineCost: 1600.0,
      currentCost: 1720.0,
      percentageChange: 7.5,
      source: 'State Irrigation Dept',
    },
  ];

  for (const ci of costItems) {
    await prisma.cultivationCost.create({ data: ci });
  }

  // 7. INITIAL BOOKINGS & WORKFLOW RECORDS FOR DEMONSTRATION
  const firstSlot = await prisma.slot.findFirst({
    where: { centreId: karnalCentre.id, date: todayStr },
  });

  if (firstSlot) {
    const booking1 = await prisma.booking.upsert({
      where: { tokenId: 'TKN-KNL-01-001' },
      update: {},
      create: {
        bookingId: 'BKG-2026-1001',
        tokenId: 'TKN-KNL-01-001',
        farmerId: 'FARMER-HR-2026-101',
        centreId: karnalCentre.id,
        crop: 'Wheat',
        requestedQuantity: 40.0,
        allocatedQuantity: 40.0,
        slotId: firstSlot.id,
        scheduledDateTime: new Date(`${todayStr}T08:30:00`),
        queueNumber: 1,
        queueStatus: 'CALLED',
        tokenStatus: 'ACTIVE',
        validityStart: new Date(`${todayStr}T08:00:00`),
        validityEnd: new Date(`${todayStr}T10:00:00`),
        checkInTime: new Date(`${todayStr}T08:15:00`),
      },
    });

    await prisma.queueEntry.upsert({
      where: { tokenId: 'TKN-KNL-01-001' },
      update: {},
      create: {
        centreId: karnalCentre.id,
        bookingId: booking1.id,
        tokenId: 'TKN-KNL-01-001',
        serviceDate: todayStr,
        queueNumber: 1,
        counterNumber: 1,
        status: 'CALLED',
        arrivalTime: new Date(`${todayStr}T08:15:00`),
        actualCallTime: new Date(`${todayStr}T08:35:00`),
      },
    });

    // Update slot counts
    await prisma.slot.update({
      where: { id: firstSlot.id },
      data: {
        reservedQuantity: 40.0,
        availableQuantity: firstSlot.capacity - 40.0,
        bookedFarmerCount: 1,
      },
    });

    // Second booking: Gurpreet Singh waiting
    const booking2 = await prisma.booking.upsert({
      where: { tokenId: 'TKN-KNL-01-002' },
      update: {},
      create: {
        bookingId: 'BKG-2026-1002',
        tokenId: 'TKN-KNL-01-002',
        farmerId: 'FARMER-PB-2026-102',
        centreId: karnalCentre.id,
        crop: 'Wheat',
        requestedQuantity: 50.0,
        allocatedQuantity: 50.0,
        slotId: firstSlot.id,
        scheduledDateTime: new Date(`${todayStr}T09:00:00`),
        queueNumber: 2,
        queueStatus: 'WAITING',
        tokenStatus: 'ACTIVE',
        validityStart: new Date(`${todayStr}T08:30:00`),
        validityEnd: new Date(`${todayStr}T10:30:00`),
        checkInTime: new Date(`${todayStr}T08:40:00`),
      },
    });

    await prisma.queueEntry.upsert({
      where: { tokenId: 'TKN-KNL-01-002' },
      update: {},
      create: {
        centreId: karnalCentre.id,
        bookingId: booking2.id,
        tokenId: 'TKN-KNL-01-002',
        serviceDate: todayStr,
        queueNumber: 2,
        status: 'WAITING',
        arrivalTime: new Date(`${todayStr}T08:40:00`),
      },
    });

    // Past completed booking for Baldev Singh
    const booking0 = await prisma.booking.upsert({
      where: { tokenId: 'TKN-KNL-01-000' },
      update: {},
      create: {
        bookingId: 'BKG-2026-0999',
        tokenId: 'TKN-KNL-01-000',
        farmerId: 'FARMER-HR-2026-103',
        centreId: karnalCentre.id,
        crop: 'Wheat',
        requestedQuantity: 35.0,
        allocatedQuantity: 35.0,
        slotId: firstSlot.id,
        scheduledDateTime: new Date(`${todayStr}T07:00:00`),
        queueNumber: 99,
        queueStatus: 'COMPLETED',
        tokenStatus: 'USED',
        validityStart: new Date(`${todayStr}T06:30:00`),
        validityEnd: new Date(`${todayStr}T08:30:00`),
        checkInTime: new Date(`${todayStr}T06:50:00`),
      },
    });

    // Completed past procurement for Baldev Singh
    const pastProc = await prisma.procurementRecord.upsert({
      where: { tokenId: 'TKN-KNL-01-000' },
      update: {},
      create: {
        procurementId: 'PRC-2026-8801',
        farmerId: 'FARMER-HR-2026-103',
        tokenId: 'TKN-KNL-01-000',
        bookingId: booking0.id,
        crop: 'Wheat',
        centreId: karnalCentre.id,
        expectedQuantity: 35.0,
        actualDeliveredQuantity: 35.0,
        acceptedQuantity: 35.0,
        additionalQuantity: 0.0,
        finalProcuredQuantity: 35.0,
        applicableRate: 2425.0,
        payableAmount: 84875.0,
        procurementStatus: 'CONFIRMED',
      },
    });

    await prisma.payment.upsert({
      where: { procurementId: pastProc.procurementId },
      update: {},
      create: {
        paymentId: 'PAY-2026-9001',
        procurementId: pastProc.procurementId,
        farmerId: 'FARMER-HR-2026-103',
        payableAmount: 84875.0,
        status: 'PAID',
        paymentReference: 'PFMS-NEFT-2026-884102',
        bankAccountMasked: 'XXXXXXXX3102',
        ifscCode: 'HDFC0000456',
        expectedProcessingDate: new Date(),
        completedAt: new Date(),
      },
    });
  }

  console.log('Seed completed successfully!');
  console.log('Demo Accounts created:');
  console.log('1. Farmer: username="farmer_ramesh", password="password123"');
  console.log('2. Centre Operator: username="operator_karnal", password="password123"');
  console.log('3. Centre Manager: username="admin_sharma", password="password123"');
  console.log('4. Quality Officer: username="quality_dr_anita", password="password123"');
  console.log('5. Weighment Operator: username="weigh_vikram", password="password123"');
  console.log('6. Finance Officer: username="finance_neha", password="password123"');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
