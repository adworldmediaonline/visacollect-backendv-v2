import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
  {
    paymentId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    applicationId: {
      type: String,
      required: true,
      index: true,
    },
    provider: {
      type: String,
      required: true,
      enum: ['PAYPAL'],
      default: 'PAYPAL',
    },
    orderId: {
      type: String,
      required: true,
      index: true,
    },
    transactionId: {
      type: String,
      sparse: true,
      index: true,
    },
    status: {
      type: String,
      required: true,
      enum: [
        'CREATED',
        'APPROVED',
        'COMPLETED',
        'FAILED',
        'REFUNDED',
        'CANCELLED',
      ],
      default: 'CREATED',
    },
    amount: {
      type: mongoose.Decimal128,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      default: 'USD',
    },
    payerEmail: {
      type: String,
      trim: true,
      lowercase: true,
    },
    payerId: {
      type: String,
      trim: true,
    },
    payerName: {
      firstName: { type: String, trim: true },
      lastName: { type: String, trim: true },
    },
    paymentMethod: {
      type: String,
      enum: ['PAYPAL', 'CREDIT_CARD', 'DEBIT_CARD'],
    },
    paypalFee: {
      type: mongoose.Decimal128,
    },
    paypalResponse: {
      type: mongoose.Schema.Types.Mixed,
    },
    webhookEvents: [
      {
        eventType: { type: String, required: true },
        eventId: { type: String, required: true, unique: true },
        resource: { type: mongoose.Schema.Types.Mixed },
        receivedAt: { type: Date, default: Date.now },
      },
    ],
    metadata: {
      type: mongoose.Schema.Types.Mixed,
    },
    idempotencyKey: {
      type: String,
      index: true,
    },
    errorMessage: {
      type: String,
    },
    refundedAt: {
      type: Date,
    },
    refundedAmount: {
      type: mongoose.Decimal128,
    },
    refundReason: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for efficient queries
paymentSchema.index({ applicationId: 1, status: 1 });
paymentSchema.index({ orderId: 1, provider: 1 });
paymentSchema.index({ transactionId: 1 }, { sparse: true });

// Virtual for formatted amount
paymentSchema.virtual('formattedAmount').get(function () {
  return `${this.currency} ${this.amount.toString()}`;
});

// Method to check if payment is completed
paymentSchema.methods.isCompleted = function () {
  return this.status === 'COMPLETED';
};

// Method to check if payment can be captured
paymentSchema.methods.canBeCaptured = function () {
  return this.status === 'APPROVED';
};

// Method to check if payment can be refunded
paymentSchema.methods.canBeRefunded = function () {
  return this.status === 'COMPLETED' && !this.refundedAt;
};

// Method to add webhook event
paymentSchema.methods.addWebhookEvent = function (
  eventType,
  eventId,
  resource
) {
  // Check if event already exists
  const exists = this.webhookEvents.some((event) => event.eventId === eventId);
  if (!exists) {
    this.webhookEvents.push({
      eventType,
      eventId,
      resource,
      receivedAt: new Date(),
    });
  }
  return this.save();
};

// Static method to find payment by order ID
paymentSchema.statics.findByOrderId = function (orderId) {
  return this.findOne({ orderId });
};

// Static method to find payment by transaction ID
paymentSchema.statics.findByTransactionId = function (transactionId) {
  return this.findOne({ transactionId });
};

// Static method to find payments by application ID
paymentSchema.statics.findByApplicationId = function (applicationId) {
  return this.find({ applicationId }).sort({ createdAt: -1 });
};

// Static method to get payment statistics
paymentSchema.statics.getPaymentStats = async function () {
  const stats = await this.aggregate([
    {
      $group: {
        _id: '$status',
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' },
      },
    },
  ]);

  return stats.reduce((acc, stat) => {
    acc[stat._id.toLowerCase()] = {
      count: stat.count,
      totalAmount: stat.totalAmount,
    };
    return acc;
  }, {});
};

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
