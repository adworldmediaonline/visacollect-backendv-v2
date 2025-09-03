import mongoose from 'mongoose';

const turkeyVisaFeeSchema = new mongoose.Schema(
  {
    country: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    visaFee: {
      type: Number,
      required: true,
      min: 0,
    },
    duration: {
      type: String,
      required: true,
      enum: ['30 Days', '90 Days'],
    },
    numberOfEntries: {
      type: String,
      required: true,
      enum: ['Single-Entry', 'Multiple-Entry'],
    },
    serviceFee: {
      type: Number,
      required: true,
      default: 35,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries
turkeyVisaFeeSchema.index({ country: 1, isActive: 1 });

// Static method to get visa fee by country
turkeyVisaFeeSchema.statics.getFeeByCountry = function (country) {
  return this.findOne({ country, isActive: true });
};

// Static method to get all active visa fees
turkeyVisaFeeSchema.statics.getAllActiveFees = function () {
  return this.find({ isActive: true }).sort({ country: 1 });
};

const TurkeyVisaFee = mongoose.model('TurkeyVisaFee', turkeyVisaFeeSchema);

export default TurkeyVisaFee;
