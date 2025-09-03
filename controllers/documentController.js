import { v2 as cloudinary } from 'cloudinary';
import multer from 'multer';
import { secret } from '../config/env.js';
import { AppError, asyncHandler } from '../middleware/error-handler.js';

// Configure Cloudinary
cloudinary.config({
  cloud_name: secret.cloudinaryCloudName,
  api_key: secret.cloudinaryApiKey,
  api_secret: secret.cloudinaryApiSecret,
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: secret.maxFileSize || 5 * 1024 * 1024, // 5MB default
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/pdf',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new AppError(
          'Invalid file type. Only PDF, JPG, and PNG files are allowed.',
          400
        ),
        false
      );
    }
  },
});

// Generate unique filename
const generateUniqueFilename = (originalName, folder = '') => {
  const timestamp = Date.now();
  const randomId = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop()?.toLowerCase() || 'unknown';

  const baseName = originalName.replace(/\.[^/.]+$/, ''); // Remove extension
  const sanitizedBaseName = baseName.replace(/[^a-zA-Z0-9]/g, '_');

  if (folder) {
    return `${folder}/${sanitizedBaseName}_${timestamp}_${randomId}.${extension}`;
  }

  return `${sanitizedBaseName}_${timestamp}_${randomId}.${extension}`;
};

// Convert buffer to data URI for Cloudinary
const bufferToDataURI = (buffer, mimetype) => {
  const base64 = buffer.toString('base64');
  return `data:${mimetype};base64,${base64}`;
};

// Upload single file to Cloudinary
const uploadToCloudinary = async (file, folder = '') => {
  try {
    const publicId = generateUniqueFilename(file.originalname, folder);

    // Convert buffer to data URI for Cloudinary
    const dataURI = bufferToDataURI(file.buffer, file.mimetype);

    const result = await cloudinary.uploader.upload(dataURI, {
      public_id: publicId,
      resource_type: 'auto',
      folder: folder ? folder.split('/')[0] : undefined,
    });

    return {
      name: file.originalname,
      url: result.secure_url,
      publicId: result.public_id,
      uploadedAt: new Date().toISOString(),
      size: file.size,
      format: result.format,
      width: result.width || null,
      height: result.height || null,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new AppError('Failed to upload file to cloud storage', 500);
  }
};

// @desc    Upload single document
// @route   POST /api/v1/single/document
// @access  Public
export const uploadSingleDocument = [
  upload.single('document'),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    const uploadResult = await uploadToCloudinary(req.file);

    res.status(200).json({
      success: true,
      message: 'Document uploaded successfully',
      data: uploadResult,
    });
  }),
];

// @desc    Upload multiple documents
// @route   POST /api/v1/multiple/document
// @access  Public
export const uploadMultipleDocuments = [
  upload.array('documents', 10), // Maximum 10 files
  asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
      throw new AppError('No files uploaded', 400);
    }

    // Get folder from request body or query params
    const folder = req.body.folder || req.query.folder || '';

    try {
      const uploadPromises = req.files.map((file) =>
        uploadToCloudinary(file, folder)
      );
      const uploadResults = await Promise.all(uploadPromises);

      res.status(200).json({
        success: true,
        message: `${uploadResults.length} documents uploaded successfully`,
        data: uploadResults,
        count: uploadResults.length,
      });
    } catch (error) {
      // If any upload fails, clean up successful uploads
      console.error('Multiple upload error:', error);
      throw new AppError('Failed to upload one or more documents', 500);
    }
  }),
];

// @desc    Delete document from Cloudinary
// @route   DELETE /api/v1/document/:publicId
// @access  Public
export const deleteDocument = asyncHandler(async (req, res) => {
  const { publicId } = req.params;

  if (!publicId) {
    throw new AppError('Public ID is required', 400);
  }

  try {
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok') {
      res.status(200).json({
        success: true,
        message: 'Document deleted successfully',
        data: {
          publicId,
          deleted: true,
        },
      });
    } else {
      throw new AppError('Failed to delete document', 500);
    }
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new AppError('Failed to delete document', 500);
  }
});

// @desc    Get document info from Cloudinary
// @route   GET /api/v1/document/:publicId
// @access  Public
export const getDocumentInfo = asyncHandler(async (req, res) => {
  const { publicId } = req.params;

  if (!publicId) {
    throw new AppError('Public ID is required', 400);
  }

  try {
    const result = await cloudinary.api.resource(publicId);

    res.status(200).json({
      success: true,
      data: {
        publicId: result.public_id,
        url: result.secure_url,
        format: result.format,
        size: result.bytes,
        width: result.width || null,
        height: result.height || null,
        createdAt: result.created_at,
      },
    });
  } catch (error) {
    console.error('Cloudinary info error:', error);
    if (error.http_code === 404) {
      throw new AppError('Document not found', 404);
    }
    throw new AppError('Failed to get document information', 500);
  }
});
