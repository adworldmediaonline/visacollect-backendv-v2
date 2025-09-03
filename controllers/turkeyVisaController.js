import { AppError, asyncHandler } from '../middleware/error-handler.js';
import TurkeyApplication from '../models/TurkeyApplication.js';
import TurkeyVisaFee from '../models/TurkeyVisaFee.js';
import {
  generateApplicationId,
  getSupportedCountries,
  sendApplicationCompletedEmail,
  sendApplicationStartedEmail,
} from '../utils/application.js';
import {
  addApplicantSchema,
  applicantDetailsSchema,
  documentUploadSchema,
  startApplicationSchema,
  validateData,
} from '../utils/validation.js';

// @desc    Get visa fee information
// @route   GET /api/v1/turkey/visa-fee
// @access  Public
export const getVisaFees = asyncHandler(async (req, res) => {
  const { country } = req.query;

  let fees;
  if (country) {
    const fee = await TurkeyVisaFee.getFeeByCountry(country);
    if (!fee) {
      throw new AppError(`Visa fee not found for country: ${country}`, 404);
    }
    fees = fee;
  } else {
    fees = await TurkeyVisaFee.getAllActiveFees();
  }

  res.status(200).json({
    success: true,
    data: fees,
    count: Array.isArray(fees) ? fees.length : 1,
  });
});

// @desc    Start new visa application
// @route   POST /api/v1/turkey/start
// @access  Public
export const startApplication = asyncHandler(async (req, res) => {
  // Validate input data
  const validation = validateData(startApplicationSchema, req.body);
  if (!validation.success) {
    throw new AppError('Validation failed', 400, true);
  }

  const { passportCountry, visaType, destination, email } = validation.data;

  // Check if country is supported
  const supportedCountries = getSupportedCountries();
  if (!supportedCountries.includes(passportCountry)) {
    throw new AppError(
      `Visa service not available for ${passportCountry}`,
      400
    );
  }

  // Check if user already has a draft application
  const existingDraft = await TurkeyApplication.findOne({
    email,
    status: { $in: ['draft', 'started'] },
  });

  if (existingDraft) {
    throw new AppError(
      `You already have a draft application (${existingDraft.applicationId}). Please complete it first.`,
      400
    );
  }

  // Generate unique application ID
  let applicationId;
  let isUnique = false;
  let attempts = 0;

  while (!isUnique && attempts < 10) {
    applicationId = generateApplicationId();
    const existing = await TurkeyApplication.findOne({ applicationId });
    if (!existing) {
      isUnique = true;
    }
    attempts++;
  }

  if (!isUnique) {
    throw new AppError('Unable to generate unique application ID', 500);
  }

  // Get visa fee for the country
  const visaFee = await TurkeyVisaFee.getFeeByCountry(passportCountry);
  if (!visaFee) {
    throw new AppError(
      `Visa fee information not available for ${passportCountry}`,
      404
    );
  }

  // Create new application
  await TurkeyApplication.create({
    applicationId,
    passportCountry,
    visaType,
    destination,
    email,
    status: 'started',
    currentStep: 1,
    visaFee: visaFee.visaFee,
    serviceFee: visaFee.serviceFee,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent'),
  });

  // Send confirmation email
  try {
    await sendApplicationStartedEmail(email, applicationId, {
      passportCountry,
      visaType,
      destination,
    });
  } catch (emailError) {
    console.error('Failed to send confirmation email:', emailError);
    // Don't fail the application creation if email fails
  }

  // Calculate total fee
  const totalFee = visaFee.visaFee * 1 + visaFee.serviceFee;

  res.status(201).json({
    success: true,
    message: 'Application started successfully',
    data: {
      applicationId,
      email,
      status: 'started',
      currentStep: 1,
      nextStep: 'applicant-details',
      estimatedTotalFee: totalFee,
    },
  });
});

// @desc    Save applicant details (Step 2)
// @route   POST /api/v1/turkey/applicant-details
// @access  Public
export const saveApplicantDetails = asyncHandler(async (req, res) => {
  const { applicationId, applicantDetails } = req.body;

  if (!applicationId) {
    throw new AppError('Application ID is required', 400);
  }

  // Find application
  const application = await TurkeyApplication.findOne({ applicationId });
  if (!application) {
    throw new AppError('Application not found', 404);
  }

  // Check if application is in correct state
  if (
    !['started', 'applicant_details_completed'].includes(application.status)
  ) {
    throw new AppError(
      'Application is not in the correct state for this operation',
      400
    );
  }

  // Validate applicant details
  const validation = validateData(applicantDetailsSchema, applicantDetails);
  if (!validation.success) {
    throw new AppError('Validation failed', 400, true);
  }

  // Update application with main applicant details
  application.mainApplicant = {
    ...validation.data,
    dateOfBirth: new Date(validation.data.dateOfBirth),
    passportIssueDate: new Date(validation.data.passportIssueDate),
    passportExpiryDate: new Date(validation.data.passportExpiryDate),
  };

  application.status = 'applicant_details_completed';
  application.currentStep = 3; // Skip to documents step

  await application.save();

  res.status(200).json({
    success: true,
    message: 'Applicant details saved successfully',
    data: {
      applicationId,
      status: application.status,
      currentStep: application.currentStep,
      nextStep: 'documents',
    },
  });
});

// @desc    Upload documents (Step 3)
// @route   POST /api/v1/turkey/documents
// @access  Public
export const uploadDocuments = asyncHandler(async (req, res) => {
  const { applicationId, documents } = req.body;

  if (!applicationId) {
    throw new AppError('Application ID is required', 400);
  }

  // Find application
  const application = await TurkeyApplication.findOne({ applicationId });
  if (!application) {
    throw new AppError('Application not found', 404);
  }

  // Check if main applicant details are completed
  if (!application.mainApplicant) {
    throw new AppError('Please complete applicant details first', 400);
  }

  // Check if we're in the correct status for document upload
  if (
    application.status !== 'applicant_details_completed' &&
    application.currentStep < 3
  ) {
    throw new AppError('Please complete applicant details first', 400);
  }

  // Validate document data
  const validation = validateData(documentUploadSchema, documents);
  if (!validation.success) {
    throw new AppError('Validation failed', 400, true);
  }

  // Update main applicant documents
  application.mainApplicant.documents = validation.data;

  // Update application status
  application.status = 'documents_completed';
  application.currentStep = 4;

  await application.save();

  res.status(200).json({
    success: true,
    message: 'Documents uploaded successfully',
    data: {
      applicationId,
      status: application.status,
      currentStep: application.currentStep,
      nextStep: 'add-applicant',
    },
  });
});

// @desc    Add additional applicant (Step 4)
// @route   POST /api/v1/turkey/add-applicant
// @access  Public
export const addApplicant = asyncHandler(async (req, res) => {
  const { applicationId, applicant } = req.body;

  if (!applicationId) {
    throw new AppError('Application ID is required', 400);
  }

  // Find application
  const application = await TurkeyApplication.findOne({ applicationId });
  if (!application) {
    throw new AppError('Application not found', 404);
  }

  // Check if main applicant documents are completed
  if (application.status !== 'documents_completed') {
    throw new AppError('Please complete main applicant documents first', 400);
  }

  // Validate additional applicant data
  const validation = validateData(addApplicantSchema, { applicant });
  if (!validation.success) {
    throw new AppError('Validation failed', 400, true);
  }

  // Initialize additional applicants array if it doesn't exist
  if (!application.additionalApplicants) {
    application.additionalApplicants = [];
  }

  // Add new applicant
  const newApplicant = {
    ...validation.data.applicant,
    dateOfBirth: new Date(validation.data.applicant.dateOfBirth),
    passportIssueDate: new Date(validation.data.applicant.passportIssueDate),
    passportExpiryDate: new Date(validation.data.applicant.passportExpiryDate),
  };

  application.additionalApplicants.push(newApplicant);

  await application.save();

  res.status(200).json({
    success: true,
    message: 'Additional applicant added successfully',
    data: {
      applicationId,
      totalApplicants: application.totalApplicants,
      status: application.status,
      currentStep: application.currentStep,
    },
  });
});

// @desc    Get application by ID
// @route   GET /api/v1/turkey/application/:applicationId
// @access  Public
export const getApplication = asyncHandler(async (req, res) => {
  const { applicationId } = req.params;
  const { email } = req.query;

  if (!applicationId) {
    throw new AppError('Application ID is required', 400);
  }

  // Find application
  const application = await TurkeyApplication.findOne({ applicationId });
  if (!application) {
    throw new AppError('Application not found', 404);
  }

  // If email is provided, verify it matches
  if (email && application.email !== email.toLowerCase()) {
    throw new AppError('Unauthorized access to application', 403);
  }

  // Remove sensitive information from response
  const applicationData = application.toObject();
  delete applicationData.ipAddress;
  delete applicationData.userAgent;

  res.status(200).json({
    success: true,
    data: applicationData,
  });
});

// @desc    Submit application for processing
// @route   POST /api/v1/turkey/submit
// @access  Public
export const submitApplication = asyncHandler(async (req, res) => {
  const { applicationId } = req.body;

  if (!applicationId) {
    throw new AppError('Application ID is required', 400);
  }

  // Find application
  const application = await TurkeyApplication.findOne({ applicationId });
  if (!application) {
    throw new AppError('Application not found', 404);
  }

  // Check if application is ready for submission
  if (application.status !== 'documents_completed') {
    throw new AppError('Application is not ready for submission', 400);
  }

  // Validate all applicants have complete information
  if (!application.mainApplicant || !application.mainApplicant.documents) {
    throw new AppError('Main applicant information is incomplete', 400);
  }

  // Calculate total fee
  application.calculateTotalFee();

  // Update application status
  application.status = 'submitted';
  application.submittedAt = new Date();

  await application.save();

  // Send completion email
  try {
    await sendApplicationCompletedEmail(application.email, applicationId, {
      totalApplicants: application.totalApplicants,
      totalFee: application.totalFee,
    });
  } catch (emailError) {
    console.error('Failed to send completion email:', emailError);
  }

  res.status(200).json({
    success: true,
    message: 'Application submitted successfully',
    data: {
      applicationId,
      status: 'submitted',
      totalApplicants: application.totalApplicants,
      totalFee: application.totalFee,
      submittedAt: application.submittedAt,
    },
  });
});

// @desc    Get supported countries
// @route   GET /api/v1/turkey/countries
// @access  Public
export const getSupportedCountriesList = asyncHandler(async (req, res) => {
  const countries = getSupportedCountries();

  res.status(200).json({
    success: true,
    data: countries,
    count: countries.length,
  });
});
