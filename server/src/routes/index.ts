import { Router } from 'express';
import { authenticateToken, requireRole } from '../middleware/auth';
import { UserRole } from '../types';

import { authController } from '../controllers/authController';
import { centreController } from '../controllers/centreController';
import { cropController } from '../controllers/cropController';
import { slotController } from '../controllers/slotController';
import { bookingController } from '../controllers/bookingController';
import { queueController } from '../controllers/queueController';
import { qualityController } from '../controllers/qualityController';
import { weighmentController } from '../controllers/weighmentController';
import { quantityAdjustmentController } from '../controllers/quantityAdjustmentController';
import { procurementController } from '../controllers/procurementController';
import { paymentController } from '../controllers/paymentController';
import { delayController } from '../controllers/delayController';
import { notificationController } from '../controllers/notificationController';
import { cultivationCostController } from '../controllers/cultivationCostController';
import { auditController } from '../controllers/auditController';
import { dashboardController } from '../controllers/dashboardController';

const router = Router();

// 1. AUTH & USER
router.post('/auth/login', authController.login);
router.post('/auth/register', authController.registerFarmer);
router.get('/auth/me', authenticateToken, authController.getCurrentUser);
router.post('/auth/switch-role', authController.switchRole); // Rapid role demonstration

// 2. CENTRES
router.get('/centres', centreController.listCentres);
router.get('/centres/:id', centreController.getCentreById);
router.patch(
  '/centres/:id/status',
  authenticateToken,
  requireRole(UserRole.CENTRE_MANAGER, UserRole.CENTRE_OPERATOR),
  centreController.updateCentreStatus
);

// 3. CROPS & QUALITY CONFIGURATIONS
router.get('/crops', cropController.listCrops);

// 4. SLOTS & CAPACITY
router.get('/slots', slotController.getSlotsByCentreAndDate);
router.post(
  '/slots/generate',
  authenticateToken,
  requireRole(UserRole.CENTRE_MANAGER),
  slotController.generateDailySlots
);

// 5. BOOKINGS & TOKENS
router.post(
  '/bookings',
  authenticateToken,
  requireRole(UserRole.FARMER, UserRole.CENTRE_OPERATOR),
  bookingController.createBooking
);
router.get(
  '/bookings/my',
  authenticateToken,
  requireRole(UserRole.FARMER),
  bookingController.getFarmerBookings
);
router.get('/bookings/token/:tokenId', bookingController.getTokenDetails);
router.post(
  '/bookings/token/:tokenId/cancel',
  authenticateToken,
  bookingController.cancelBooking
);
router.get('/bookings/token/:tokenId/receipt', bookingController.getDigitalReceipt);

// 6. SMART ARRIVAL & LIVE QUEUE
router.post('/queue/check-in', queueController.checkIn);
router.get('/queue/board/:centreId', queueController.getLiveQueueBoard);
router.post(
  '/queue/call-next',
  authenticateToken,
  requireRole(UserRole.CENTRE_OPERATOR, UserRole.CENTRE_MANAGER),
  queueController.callNext
);
router.patch(
  '/queue/centre/:centreId/counters',
  authenticateToken,
  requireRole(UserRole.CENTRE_OPERATOR, UserRole.CENTRE_MANAGER),
  queueController.setCounterStatus
);

// 7. QUALITY ASSAY
router.get(
  '/quality/pending',
  authenticateToken,
  requireRole(UserRole.QUALITY_OFFICER, UserRole.CENTRE_MANAGER),
  qualityController.getPendingTests
);
router.post(
  '/quality/assay',
  authenticateToken,
  requireRole(UserRole.QUALITY_OFFICER),
  qualityController.recordAssay
);
router.post(
  '/quality/retest/:tokenId',
  authenticateToken,
  requireRole(UserRole.QUALITY_OFFICER, UserRole.CENTRE_MANAGER),
  qualityController.requestRetest
);

// 8. WEIGHMENT
router.get(
  '/weighment/awaiting',
  authenticateToken,
  requireRole(UserRole.WEIGHMENT_OPERATOR, UserRole.CENTRE_MANAGER),
  weighmentController.getAwaitingWeighment
);
router.post(
  '/weighment',
  authenticateToken,
  requireRole(UserRole.WEIGHMENT_OPERATOR),
  weighmentController.recordWeighment
);

// 9. QUANTITY ADJUSTMENT (Manager Approval)
router.get(
  '/adjustments/pending',
  authenticateToken,
  requireRole(UserRole.CENTRE_MANAGER),
  quantityAdjustmentController.listPendingAdjustments
);
router.post(
  '/adjustments/:id/decision',
  authenticateToken,
  requireRole(UserRole.CENTRE_MANAGER),
  quantityAdjustmentController.handleDecision
);

// 10. PROCUREMENT RECORDS
router.get(
  '/procurements',
  authenticateToken,
  procurementController.listProcurements
);
router.get(
  '/procurements/:id',
  authenticateToken,
  procurementController.getProcurementById
);

// 11. PAYMENTS & FINANCE
router.get(
  '/payments',
  authenticateToken,
  requireRole(UserRole.FINANCE_OFFICER, UserRole.CENTRE_MANAGER, UserRole.FARMER),
  paymentController.listPayments
);
router.patch(
  '/payments/:paymentId/status',
  authenticateToken,
  requireRole(UserRole.FINANCE_OFFICER),
  paymentController.updatePayment
);
router.get(
  '/payments/summary',
  authenticateToken,
  requireRole(UserRole.FINANCE_OFFICER, UserRole.CENTRE_MANAGER),
  paymentController.getFinanceSummary
);

// 12. DELAYS & TOKEN PROTECTION
router.post(
  '/delays',
  authenticateToken,
  requireRole(UserRole.CENTRE_OPERATOR, UserRole.CENTRE_MANAGER),
  delayController.recordDelay
);
router.get('/delays', delayController.listCentreDelays);

// 13. NOTIFICATIONS
router.get('/notifications', authenticateToken, notificationController.getMyNotifications);
router.patch('/notifications/:id/read', authenticateToken, notificationController.markAsRead);
router.post('/notifications/read-all', authenticateToken, notificationController.markAllAsRead);

// 14. CULTIVATION COSTS
router.get('/cultivation-costs', cultivationCostController.getCosts);

// 15. AUDIT LOGS
router.get(
  '/audit',
  authenticateToken,
  requireRole(UserRole.CENTRE_MANAGER),
  auditController.getAuditLogs
);

// 16. DASHBOARDS
router.get(
  '/dashboards/farmer',
  authenticateToken,
  requireRole(UserRole.FARMER),
  dashboardController.getFarmerDashboard
);
router.get(
  '/dashboards/admin',
  authenticateToken,
  requireRole(UserRole.CENTRE_MANAGER, UserRole.CENTRE_OPERATOR),
  dashboardController.getAdminDashboard
);

export default router;
