import express from 'express';
import {
  capturePayPalOrder,
  createPayPalOrder,
  getPaymentByApplicationId,
  getPaymentStats,
  getPaymentStatus,
  handlePayPalWebhook,
  refundPayment,
} from '../controllers/paymentController.js';

const router = express.Router();

// PayPal payment routes
router.post('/paypal/create', createPayPalOrder);
router.post('/paypal/capture', capturePayPalOrder);
router.post('/paypal/webhook', handlePayPalWebhook);

// General payment routes
router.get('/application/:applicationId', getPaymentByApplicationId);
router.get('/stats/payment', getPaymentStats);
router.get('/:paymentId', getPaymentStatus);
router.post('/refund', refundPayment);

export default router;
