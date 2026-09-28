import request from 'supertest';
import app from './src/index.ts';
import { prisma } from './src/prisma.ts';

const run = async () => {
  const loginRes = await request(app).post('/api/v1/auth/login').send({ username: 'farmer_ramesh', password: 'password123' });
  console.log('LOGIN_STATUS', loginRes.status);
  console.log('LOGIN_BODY', JSON.stringify(loginRes.body, null, 2));

  const token = loginRes.body?.data?.token;
  if (!token) {
    console.log('NO TOKEN RETURNED');
    return;
  }

  const centre = await prisma.procurementCentre.findFirst();
  const slot = await prisma.slot.upsert({
    where: { centreId_date_startTime: { centreId: centre!.id, date: '2026-11-20', startTime: '10:00' } },
    update: { capacity: 40, availableQuantity: 40, reservedQuantity: 0, bookedFarmerCount: 0, slotStatus: 'AVAILABLE' },
    create: { centreId: centre!.id, date: '2026-11-20', startTime: '10:00', endTime: '11:00', capacity: 40, availableQuantity: 40, reservedQuantity: 0, bookedFarmerCount: 0, slotStatus: 'AVAILABLE' }
  });

  const res = await request(app)
    .post('/api/v1/bookings')
    .set('Authorization', `Bearer ${token}`)
    .send({ centreId: centre!.id, crop: 'Wheat', requestedQuantity: 12.5, preferredDate: '2026-11-20', slotId: slot.id });

  console.log('BOOK_STATUS', res.status);
  console.log('BOOK_BODY', JSON.stringify(res.body, null, 2));
};

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
