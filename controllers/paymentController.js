import { v4 as uuidv4 } from 'uuid';
import { AppError, asyncHandler } from '../middleware/error-handler.js';
import Payment from '../models/Payment.js';
import TurkeyApplication from '../models/TurkeyApplication.js';
import paypalService from '../utils/paypal.js';
import {
  capturePaymentSchema,
  createPaymentSchema,
  refundPaymentSchema,
  validateData,
} from '../utils/validation.js';

// @desc    Create PayPal payment order
// @route   POST /api/v1/payment/paypal/create
// @access  Public
export const createPayPalOrder = asyncHandler(async (req, res) => {
  const { applicationId, amount, currency = 'USD', description } = req.body;

  // Validate input
  const validation = validateData(createPaymentSchema, {
    applicationId,
    amount,
    currency,
    description,
  });

  if (!validation.success) {
    throw new AppError('Validation failed', 400, true);
  }

  // Check if application exists and is in correct state
  const application = await TurkeyApplication.findOne({ applicationId });
  if (!application) {
    throw new AppError('Application not found', 404);
  }

  // Check if application can accept payments
  if (!['documents_completed', 'submitted'].includes(application.status)) {
    throw new AppError('Application is not ready for payment', 400);
  }

  // Check if payment already exists for this application
  const existingPayment = await Payment.findOne({
    applicationId,
    status: { $in: ['CREATED', 'APPROVED', 'COMPLETED'] },
  });

  if (existingPayment) {
    throw new AppError('Payment already exists for this application', 400);
  }

  try {
    // Create PayPal order
    const paypalOrder = await paypalService.createOrder(
      amount,
      currency,
      description || `Visa Application Payment - ${applicationId}`
    );

    // Generate payment ID
    const paymentId = `PAY-${uuidv4().substring(0, 8).toUpperCase()}`;

    // Create payment record
    const payment = await Payment.create({
      paymentId,
      applicationId,
      provider: 'PAYPAL',
      orderId: paypalOrder.id,
      status: 'CREATED',
      amount: amount,
      currency: currency,
      metadata: {
        paypalOrder: paypalOrder,
        createdAt: new Date(),
      },
      idempotencyKey: paypalService.constructor.generateIdempotencyKey(),
    });

    // Find approval URL
    const approvalUrl = paypalOrder.links.find(
      (link) => link.rel === 'approve'
    )?.href;

    if (!approvalUrl) {
      throw new AppError('Failed to get PayPal approval URL', 500);
    }

    res.status(201).json({
      success: true,
      message: 'PayPal order created successfully',
      data: {
        paymentId: payment.paymentId,
        orderId: paypalOrder.id,
        approvalUrl,
        status: 'CREATED',
        amount: amount,
        currency: currency,
      },
    });
  } catch (error) {
    console.error('PayPal order creation error:', error);
    throw new AppError('Failed to create PayPal order', 500);
  }
});

// @desc    Capture PayPal payment
// @route   POST /api/v1/payment/paypal/capture
// @access  Public
export const capturePayPalOrder = asyncHandler(async (req, res) => {
  const { orderId, applicationId } = req.body;

  // Validate input
  const validation = validateData(capturePaymentSchema, {
    orderId,
    applicationId,
  });

  if (!validation.success) {
    throw new AppError('Validation failed', 400, true);
  }

  // Find payment record
  const payment = await Payment.findOne({ orderId, applicationId });
  if (!payment) {
    throw new AppError('Payment record not found', 404);
  }

  // Check if payment can be captured
  if (!payment.canBeCaptured()) {
    throw new AppError(
      `Payment cannot be captured. Current status: ${payment.status}`,
      400
    );
  }

  try {
    // Capture PayPal order
    const captureResult = await paypalService.captureOrder(orderId);

    // Update payment record
    payment.status = 'COMPLETED';
    payment.transactionId =
      captureResult.purchase_units[0].payments.captures[0].id;
    payment.paypalFee =
      captureResult.purchase_units[0].payments.captures[0].seller_receivable_breakdown?.paypal_fee?.value;
    payment.payerEmail = captureResult.payer?.email_address;
    payment.payerId = captureResult.payer?.payer_id;
    payment.paymentMethod =
      captureResult.purchase_units[0].payments.captures[0].payment_source?.paypal?.name;

    if (captureResult.payer?.name) {
      payment.payerName = {
        firstName: captureResult.payer.name.given_name,
        lastName: captureResult.payer.name.surname,
      };
    }

    payment.paypalResponse = captureResult;
    payment.metadata.capturedAt = new Date();

    await payment.save();

    // Update application status if needed
    const application = await TurkeyApplication.findOne({ applicationId });
    if (application && application.status === 'submitted') {
      application.status = 'paid';
      await application.save();
    }

    res.status(200).json({
      success: true,
      message: 'Payment captured successfully',
      data: {
        paymentId: payment.paymentId,
        orderId: payment.orderId,
        transactionId: payment.transactionId,
        status: 'COMPLETED',
        amount: payment.amount,
        currency: payment.currency,
        payerEmail: payment.payerEmail,
        capturedAt: payment.metadata.capturedAt,
      },
    });
  } catch (error) {
    console.error('PayPal capture error:', error);

    // Update payment status to failed
    payment.status = 'FAILED';
    payment.errorMessage = error.message;
    await payment.save();

    throw new AppError('Failed to capture PayPal payment', 500);
  }
});

// @desc    Handle PayPal webhook
// @route   POST /api/v1/payment/paypal/webhook
// @access  Public
export const handlePayPalWebhook = asyncHandler(async (req, res) => {
  const webhookBody = req.body;
  const signature = req.headers['paypal-transmission-signature'];
  const certUrl = req.headers['paypal-cert-url'];
  const transmissionId = req.headers['paypal-transmission-id'];
  const transmissionTime = req.headers['paypal-transmission-time'];
  const _webhookId = req.headers['paypal-webhook-id'];

  // Verify webhook signature
  const isValidSignature = await paypalService.verifyWebhookSignature(
    webhookBody,
    {
      auth_algo: req.headers['paypal-auth-algo'],
      cert_url: certUrl,
      transmission_id: transmissionId,
      transmission_sig: signature,
      transmission_time: transmissionTime,
    }
  );

  if (!isValidSignature) {
    console.warn('Invalid PayPal webhook signature');
    return res.status(400).json({
      success: false,
      error: 'Invalid webhook signature',
    });
  }

  try {
    // Parse webhook event
    const eventData = paypalService.parseWebhookEvent(webhookBody);

    // Find payment by order ID or transaction ID
    let payment;
    if (eventData.orderId) {
      payment = await Payment.findOne({ orderId: eventData.orderId });
    } else if (eventData.transactionId) {
      payment = await Payment.findOne({
        transactionId: eventData.transactionId,
      });
    }

    if (payment) {
      // Add webhook event
      await payment.addWebhookEvent(eventData.type, webhookBody.id, eventData);

      // Update payment status based on event
      switch (eventData.type) {
        case 'PAYMENT_COMPLETED':
          if (payment.status !== 'COMPLETED') {
            payment.status = 'COMPLETED';
            payment.transactionId = eventData.transactionId;
            payment.payerEmail = eventData.payerEmail;
          }
          break;

        case 'PAYMENT_DENIED':
          payment.status = 'FAILED';
          payment.errorMessage = eventData.reason;
          break;

        case 'PAYMENT_REFUNDED':
          payment.status = 'REFUNDED';
          payment.refundedAt = new Date();
          payment.refundedAmount = eventData.refundAmount;
          break;
      }

      await payment.save();

      // Update application status if payment completed
      if (eventData.type === 'PAYMENT_COMPLETED') {
        const application = await TurkeyApplication.findOne({
          applicationId: payment.applicationId,
        });
        if (application && application.status === 'submitted') {
          application.status = 'paid';
          await application.save();
        }
      }
    }

    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
    });
  } catch (error) {
    console.error('Webhook processing error:', error);
    // Return 200 to acknowledge receipt even if processing fails
    res.status(200).json({
      success: true,
      message: 'Webhook received but processing failed',
      error: error.message,
    });
  }
});

// @desc    Get payment status
// @route   GET /api/v1/payment/:paymentId
// @access  Public
export const getPaymentStatus = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;

  const payment = await Payment.findOne({ paymentId });
  if (!payment) {
    throw new AppError('Payment not found', 404);
  }

  // Get latest PayPal order status if needed
  let paypalStatus = null;
  if (payment.status === 'CREATED' || payment.status === 'APPROVED') {
    try {
      const orderDetails = await paypalService.getOrder(payment.orderId);
      paypalStatus = orderDetails.status;
    } catch (error) {
      console.warn('Failed to get PayPal order status:', error.message);
    }
  }

  res.status(200).json({
    success: true,
    data: {
      paymentId: payment.paymentId,
      applicationId: payment.applicationId,
      orderId: payment.orderId,
      transactionId: payment.transactionId,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      payerEmail: payment.payerEmail,
      paypalStatus: paypalStatus,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    },
  });
});

// @desc    Refund payment
// @route   POST /api/v1/payment/refund
// @access  Private/Admin
export const refundPayment = asyncHandler(async (req, res) => {
  const { paymentId, amount, reason } = req.body;

  // Validate input
  const validation = validateData(refundPaymentSchema, {
    paymentId,
    amount,
    reason,
  });

  if (!validation.success) {
    throw new AppError('Validation failed', 400, true);
  }

  // Find payment
  const payment = await Payment.findOne({ paymentId });
  if (!payment) {
    throw new AppError('Payment not found', 404);
  }

  // Check if payment can be refunded
  if (!payment.canBeRefunded()) {
    throw new AppError(
      `Payment cannot be refunded. Status: ${payment.status}`,
      400
    );
  }

  try {
    // Process refund via PayPal
    const refundAmount = amount || payment.amount;
    const refundResult = await paypalService.refundPayment(
      payment.transactionId,
      refundAmount,
      reason
    );

    // Update payment record
    payment.status = 'REFUNDED';
    payment.refundedAt = new Date();
    payment.refundedAmount = refundAmount;
    payment.refundReason = reason;
    payment.paypalResponse = refundResult;

    await payment.save();

    res.status(200).json({
      success: true,
      message: 'Payment refunded successfully',
      data: {
        paymentId: payment.paymentId,
        refundAmount: refundAmount,
        refundId: refundResult.id,
        refundedAt: payment.refundedAt,
      },
    });
  } catch (error) {
    console.error('Refund error:', error);
    throw new AppError('Failed to process refund', 500);
  }
});

// @desc    Get payment statistics
// @route   GET /api/v1/payment/stats
// @access  Private/Admin
export const getPaymentStats = asyncHandler(async (req, res) => {
  const stats = await Payment.getPaymentStats();

  res.status(200).json({
    success: true,
    data: stats,
  });
});
