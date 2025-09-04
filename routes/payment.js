import express from 'express';
import {
  capturePayPalOrder,
  createPayPalOrder,
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
router.get('/:paymentId', getPaymentStatus);
router.post('/refund', refundPayment);
router.get('/stats/payment', getPaymentStats);

export default router;
