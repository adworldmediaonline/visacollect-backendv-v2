import mongoose from 'mongoose';

// Supporting Document Schema
const supportingDocumentSchema = new mongoose.Schema(
  {
    documentType: {
      type: String,
      required: true,
      enum: ['Visa', 'Residence Permit'],
    },
    issuingCountry: {
      type: String,
      required: true,
      trim: true,
    },
    documentNumber: {
      type: String,
      required: true,
      trim: true,
    },
    expiryDate: {
      type: Date,
      required: function () {
        return (
          this.documentType === 'Visa' ||
          this.documentType === 'Residence Permit'
        );
      },
    },
    isUnlimited: {
      type: Boolean,
      default: false,
    },
  },
  { _id: true }
);

// Document Upload Schema
const documentUploadSchema = new mongoose.Schema(
  {
    passportUrl: {
      type: String,
      trim: true,
    },
    passportPublicId: {
      type: String,
      trim: true,
    },
    supportingDocuments: [supportingDocumentSchema],
    additionalDocuments: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        url: {
          type: String,
          required: true,
          trim: true,
        },
        publicId: {
          type: String,
          trim: true,
        },
        uploadedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  { _id: false }
);

// Applicant Details Schema
const applicantDetailsSchema = new mongoose.Schema(
  {
    givenNames: {
      type: String,
      required: true,
      trim: true,
    },
    surname: {
      type: String,
      required: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    placeOfBirth: {
      type: String,
      required: true,
      trim: true,
    },
    motherName: {
      type: String,
      required: true,
      trim: true,
    },
    fatherName: {
      type: String,
      required: true,
      trim: true,
    },
    passportNumber: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
    },
    passportIssueDate: {
      type: Date,
      required: true,
    },
    passportExpiryDate: {
      type: Date,
      required: true,
    },
    documents: documentUploadSchema,
  },
  { _id: true }
);

// Main Turkey Application Schema
const turkeyApplicationSchema = new mongoose.Schema(
  {
    applicationId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    // Step 1: Start Application
    passportCountry: {
      type: String,
      required: true,
      trim: true,
    },
    visaType: {
      type: String,
      required: true,
      default: 'Electronic Visa',
    },
    destination: {
      type: String,
      required: true,
      default: 'Turkey',
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },

    // Main Applicant (required)
    mainApplicant: applicantDetailsSchema,

    // Additional Applicants (optional)
    additionalApplicants: [applicantDetailsSchema],

    // Application Status
    status: {
      type: String,
      enum: [
        'draft',
        'started',
        'applicant_details_completed',
        'documents_completed',
        'submitted',
        'paid',
        'processing',
        'approved',
        'rejected',
      ],
      default: 'draft',
    },

    // Current Step Tracking
    currentStep: {
      type: Number,
      default: 1,
      min: 1,
      max: 4,
    },

    // Visa Fee Information (calculated at submission)
    visaFee: {
      type: Number,
      min: 0,
    },
    serviceFee: {
      type: Number,
      default: 35,
      min: 0,
    },
    totalFee: {
      type: Number,
      min: 0,
    },

    // Journey Information (for validation)
    journeyDate: {
      type: Date,
    },

    // Metadata
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
    submittedAt: {
      type: Date,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for efficient queries
turkeyApplicationSchema.index({ email: 1, status: 1 });
turkeyApplicationSchema.index({ status: 1, createdAt: -1 });
turkeyApplicationSchema.index({ applicationId: 1 });

// Pre-save middleware to update lastUpdated
turkeyApplicationSchema.pre('save', function (next) {
  this.lastUpdated = new Date();
  next();
});

// Virtual for total applicants count
turkeyApplicationSchema.virtual('totalApplicants').get(function () {
  return 1 + (this.additionalApplicants ? this.additionalApplicants.length : 0);
});

// Method to calculate total fee
turkeyApplicationSchema.methods.calculateTotalFee = function () {
  const applicantCount = this.totalApplicants;
  this.totalFee =
    this.visaFee * applicantCount + this.serviceFee * applicantCount;
  return this.totalFee;
};

// Method to validate passport expiry (must be ≥ 6 months beyond journey date)
turkeyApplicationSchema.methods.validatePassportExpiry = function (
  applicant,
  journeyDate
) {
  if (!journeyDate) return true; // Skip if no journey date set

  const sixMonthsFromJourney = new Date(journeyDate);
  sixMonthsFromJourney.setMonth(sixMonthsFromJourney.getMonth() + 6);

  return applicant.passportExpiryDate >= sixMonthsFromJourney;
};

// Method to validate supporting document expiry
turkeyApplicationSchema.methods.validateSupportingDocuments = function (
  applicant,
  journeyDate
) {
  if (!applicant.documents?.supportingDocuments?.length) return true;

  return applicant.documents.supportingDocuments.every((doc) => {
    if (doc.isUnlimited) return true;
    if (!journeyDate) return true;
    return doc.expiryDate >= journeyDate;
  });
};

// Static method to find application by ID
turkeyApplicationSchema.statics.findByApplicationId = function (applicationId) {
  return this.findOne({ applicationId });
};

// Static method to get applications by email
turkeyApplicationSchema.statics.findByEmail = function (email) {
  return this.find({ email }).sort({ createdAt: -1 });
};

// Static method to get applications by status
turkeyApplicationSchema.statics.findByStatus = function (status) {
  return this.find({ status }).sort({ createdAt: -1 });
};

const TurkeyApplication = mongoose.model(
  'TurkeyApplication',
  turkeyApplicationSchema
);

export default TurkeyApplication;
