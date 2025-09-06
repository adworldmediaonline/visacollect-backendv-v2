import { z } from 'zod';

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Date validation helpers
const isValidDate = (date) => {
  return date instanceof Date && !isNaN(date.getTime());
};

const isAtLeast18YearsOld = (dateOfBirth) => {
  const today = new Date();
  const birthDate = new Date(dateOfBirth);
  const age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    return age - 1 >= 18;
  }
  return age >= 18;
};

const isFutureDate = (date) => {
  return new Date(date) > new Date();
};

const isNotTooFarInFuture = (date, maxYears = 2) => {
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + maxYears);
  return new Date(date) <= maxDate;
};

// Step 1: Start Application Validation
export const startApplicationSchema = z.object({
  passportCountry: z
    .string()
    .min(1, 'Passport country is required')
    .max(100, 'Passport country name is too long'),

  visaType: z
    .string()
    .default('Electronic Visa')
    .refine((val) => val === 'Electronic Visa', {
      message: 'Only Electronic Visa is currently supported',
    }),

  destination: z
    .string()
    .default('Turkey')
    .refine((val) => val === 'Turkey', {
      message: 'Destination must be Turkey',
    }),

  email: z
    .string()
    .min(1, 'Email is required')
    .regex(emailRegex, 'Invalid email format')
    .toLowerCase(),
});

// Step 2: Applicant Details Validation
export const applicantDetailsSchema = z.object({
  arrivalDate: z.string().refine((date) => {
    const selectedDate = new Date(date);
    const today = new Date();

    // Set both dates to start of day for fair comparison
    const selectedDateStart = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      selectedDate.getDate()
    );
    const todayStart = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );

    return isValidDate(selectedDate) && selectedDateStart >= todayStart;
  }, 'Arrival date must be today or in the future'),

  givenNames: z
    .string()
    .min(1, 'Given names are required')
    .max(100, 'Given names are too long')
    .regex(
      /^[a-zA-Z\s'-]+$/,
      'Given names can only contain letters, spaces, hyphens, and apostrophes'
    ),

  surname: z
    .string()
    .min(1, 'Surname is required')
    .max(100, 'Surname is too long')
    .regex(
      /^[a-zA-Z\s'-]+$/,
      'Surname can only contain letters, spaces, hyphens, and apostrophes'
    ),

  dateOfBirth: z.string().refine((date) => {
    const d = new Date(date);
    return isValidDate(d) && isAtLeast18YearsOld(d);
  }, 'Applicant must be at least 18 years old'),

  placeOfBirth: z
    .string()
    .min(1, 'Place of birth is required')
    .max(100, 'Place of birth is too long'),

  motherName: z
    .string()
    .min(1, "Mother's name is required")
    .max(100, "Mother's name is too long")
    .regex(
      /^[a-zA-Z\s'-]+$/,
      "Mother's name can only contain letters, spaces, hyphens, and apostrophes"
    ),

  fatherName: z
    .string()
    .min(1, "Father's name is required")
    .max(100, "Father's name is too long")
    .regex(
      /^[a-zA-Z\s'-]+$/,
      "Father's name can only contain letters, spaces, hyphens, and apostrophes"
    ),

  passportNumber: z
    .string()
    .min(1, 'Passport number is required')
    .max(20, 'Passport number is too long')
    .regex(
      /^[A-Z0-9]+$/,
      'Passport number can only contain uppercase letters and numbers'
    ),

  passportIssueDate: z.string().refine((date) => {
    const d = new Date(date);
    return isValidDate(d) && d <= new Date();
  }, 'Passport issue date cannot be in the future'),

  passportExpiryDate: z.string().refine((date) => {
    const d = new Date(date);
    return isValidDate(d) && isFutureDate(d) && isNotTooFarInFuture(d, 10);
  }, 'Passport expiry date must be in the future and not more than 10 years from now'),
});

// Supporting Document Validation
export const supportingDocumentSchema = z
  .object({
    documentType: z.enum(
      ['Visa', 'Residence Permit', 'visa', 'residence-permit'],
      {
        errorMap: () => ({
          message: 'Invalid document type selected',
        }),
      }
    ),

    issuingCountry: z
      .string()
      .min(1, 'Issuing country is required')
      .max(100, 'Issuing country name is too long'),

    documentNumber: z
      .string()
      .min(1, 'Document number is required')
      .max(50, 'Document number is too long'),

    expiryDate: z.string().optional(),
    isUnlimited: z.boolean().default(false),
  })
  .refine(
    (data) => {
      // If not unlimited, expiry date is required
      if (!data.isUnlimited && !data.expiryDate) {
        return false;
      }
      // If unlimited, expiry date should not be provided
      if (data.isUnlimited && data.expiryDate) {
        return false;
      }
      // If expiry date is provided, it should be valid
      if (data.expiryDate) {
        const d = new Date(data.expiryDate);
        return isValidDate(d);
      }
      return true;
    },
    {
      message: 'Either provide a valid expiry date or mark as unlimited',
      path: ['expiryDate'],
    }
  );

// Step 3: Document Upload Validation
export const documentUploadSchema = z
  .object({
    supportingDocuments: z
      .array(supportingDocumentSchema)
      .max(5, 'Maximum 5 supporting documents allowed')
      .optional()
      .default([]),

    additionalDocuments: z
      .array(
        z.object({
          name: z
            .string()
            .min(1, 'Document name is required')
            .max(100, 'Document name is too long'),
          url: z.string().url('Invalid document URL'),
          publicId: z.string().optional(),
          uploadedAt: z.string().optional(),
          size: z.number().optional(),
          format: z.string().optional(),
          width: z.number().optional(),
          height: z.number().optional(),
        })
      )
      .max(10, 'Maximum 10 additional documents allowed')
      .optional()
      .default([]),
  })
  .refine(
    (data) => {
      // At least one type of document must be provided
      const hasSupportingDocs =
        data.supportingDocuments && data.supportingDocuments.length > 0;
      const hasAdditionalDocs =
        data.additionalDocuments && data.additionalDocuments.length > 0;

      return hasSupportingDocs || hasAdditionalDocs;
    },
    {
      message: 'At least one document (supporting or additional) is required',
      path: ['supportingDocuments'],
    }
  );

// Complete Applicant Validation (combines details + documents)
export const completeApplicantSchema = applicantDetailsSchema.merge(
  z.object({
    documents: documentUploadSchema,
  })
);

// Step 4: Add Additional Applicant Validation
export const addApplicantSchema = z.object({
  applicant: completeApplicantSchema,
});

// Resume Application Validation
export const resumeApplicationSchema = z.object({
  applicationId: z
    .string()
    .min(1, 'Application ID is required')
    .regex(/^TUR-[A-Z0-9]{8}$/, 'Invalid application ID format'),
});

// Get Application Status Validation
export const getApplicationSchema = z.object({
  applicationId: z
    .string()
    .min(1, 'Application ID is required')
    .regex(/^TUR-[A-Z0-9]{8}$/, 'Invalid application ID format'),

  email: z.string().regex(emailRegex, 'Invalid email format').toLowerCase(),
});

// Payment validation schemas
export const createPaymentSchema = z.object({
  applicationId: z
    .string()
    .min(1, 'Application ID is required')
    .regex(/^TUR-[A-Z0-9]{8}$/, 'Invalid application ID format'),

  amount: z
    .number()
    .positive('Amount must be greater than 0')
    .max(10000, 'Amount cannot exceed $10,000'),

  currency: z
    .string()
    .length(3, 'Currency must be 3 characters')
    .regex(/^[A-Z]{3}$/, 'Currency must be uppercase letters')
    .default('USD'),

  description: z
    .string()
    .max(127, 'Description cannot exceed 127 characters')
    .optional(),
});

export const capturePaymentSchema = z.object({
  orderId: z
    .string()
    .min(1, 'Order ID is required')
    .regex(/^[\w-]+$/, 'Invalid order ID format'),

  applicationId: z
    .string()
    .min(1, 'Application ID is required')
    .regex(/^TUR-[A-Z0-9]{8}$/, 'Invalid application ID format'),
});

export const refundPaymentSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),

  amount: z
    .number()
    .positive('Refund amount must be greater than 0')
    .optional(), // If not provided, full refund

  reason: z.string().max(255, 'Reason cannot exceed 255 characters').optional(),
});

// Validation helper function
export const validateData = (schema, data) => {
  try {
    return {
      success: true,
      data: schema.parse(data),
    };
  } catch (error) {
    return {
      success: false,
      error: error.errors || error.message,
    };
  }
};

// Custom validation for passport expiry against journey date
export const validatePassportExpiryForJourney = (
  passportExpiryDate,
  journeyDate
) => {
  if (!journeyDate) return true;

  const expiryDate = new Date(passportExpiryDate);
  const journey = new Date(journeyDate);

  // Must be at least 6 months beyond journey date
  const sixMonthsFromJourney = new Date(journey);
  sixMonthsFromJourney.setMonth(sixMonthsFromJourney.getMonth() + 6);

  return expiryDate >= sixMonthsFromJourney;
};

// Custom validation for supporting document expiry
export const validateSupportingDocumentExpiry = (documents, journeyDate) => {
  if (!documents || !journeyDate) return true;

  return documents.every((doc) => {
    if (doc.isUnlimited) return true;
    const expiryDate = new Date(doc.expiryDate);
    const journey = new Date(journeyDate);
    return expiryDate >= journey;
  });
};
