import express from 'express';
import {
  deleteDocument,
  getDocumentInfo,
  uploadMultipleDocuments,
  uploadSingleDocument,
} from '../controllers/documentController.js';

const router = express.Router();

// Single document upload
router.post('/single/document', uploadSingleDocument);

// Multiple documents upload
router.post('/multiple/document', uploadMultipleDocuments);

// Document management
router.delete('/document/:publicId', deleteDocument);
router.get('/document/:publicId', getDocumentInfo);

export default router;
