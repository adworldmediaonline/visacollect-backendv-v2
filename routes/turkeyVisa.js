import express from 'express';
import {
  addApplicant,
  getApplication,
  getSupportedCountriesList,
  getVisaFees,
  saveApplicantDetails,
  startApplication,
  submitApplication,
  updateApplicantDetails,
  updateApplication,
  updateDocuments,
  uploadDocuments,
} from '../controllers/turkeyVisaController.js';

const router = express.Router();

// Public routes
router.get('/visa-fee', getVisaFees);
router.get('/countries', getSupportedCountriesList);

// Application management routes
router.post('/start', startApplication);
router.put('/application/:applicationId', updateApplication);
router.post('/applicant-details', saveApplicantDetails);
router.put('/applicant-details/:applicationId', updateApplicantDetails);
router.post('/documents', uploadDocuments);
router.put('/documents/:applicationId', updateDocuments);
router.post('/add-applicant', addApplicant);
router.post('/submit', submitApplication);

// Get application by ID
router.get('/application/:applicationId', getApplication);

export default router;
