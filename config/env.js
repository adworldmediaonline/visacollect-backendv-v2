import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const secret = {
  nodeEnv: process.env.NODE_ENV,
  port: process.env.PORT,
  mongodbUri: process.env.MONGODB_URI,
  corsOrigin: process.env.CORS_ORIGIN,
  logLevel: process.env.LOG_LEVEL,

  // Email Configuration
  emailProvider: process.env.EMAIL_PROVIDER || 'ethereal',
  emailUser: process.env.EMAIL_USER,
  emailPassword: process.env.EMAIL_PASSWORD,
  emailFrom: process.env.EMAIL_FROM,
  emailFromName: process.env.EMAIL_FROM_NAME || 'App',
  emailHost: process.env.EMAIL_HOST || 'smtp.gmail.com',
  emailPort: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT) : 587,
  emailSecure: process.env.EMAIL_SECURE === 'true',
  emailService: process.env.EMAIL_SERVICE,

  // Cloudinary Configuration
  cloudinaryCloudName: process.env.CLOUDINARY_CLOUD_NAME,
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY,
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET,

  // Application Configuration
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 5242880, // 5MB default

  // PayPal Configuration
  paypalMode: process.env.PAYPAL_MODE || 'sandbox',
  paypalClientId: process.env.PAYPAL_CLIENT_ID,
  paypalClientSecret: process.env.PAYPAL_CLIENT_SECRET,
  paypalWebhookId: process.env.PAYPAL_WEBHOOK_ID,
};
