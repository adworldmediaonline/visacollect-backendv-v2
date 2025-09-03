import express from 'express';
import {
  addApplicant,
  getApplication,
  getSupportedCountriesList,
  getVisaFees,
  saveApplicantDetails,
  startApplication,
  submitApplication,
  uploadDocuments,
} from '../controllers/turkeyVisaController.js';

const router = express.Router();

// Public routes
router.get('/visa-fee', getVisaFees);
router.get('/countries', getSupportedCountriesList);

// Application management routes
router.post('/start', startApplication);
router.post('/applicant-details', saveApplicantDetails);
router.post('/documents', uploadDocuments);
router.post('/add-applicant', addApplicant);
router.post('/submit', submitApplication);

// Get application by ID
router.get('/application/:applicationId', getApplication);

export default router;
