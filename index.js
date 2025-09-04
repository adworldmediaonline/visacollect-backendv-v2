import compression from 'compression';
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import helmet from 'helmet';
import morgan from 'morgan';

// Load environment variables
dotenv.config();

// Import configuration
import { secret } from './config/env.js';

// Import routes
import documentRoutes from './routes/document.js';
import healthRoutes from './routes/health.js';
import paymentRoutes from './routes/payment.js';
import turkeyVisaRoutes from './routes/turkeyVisa.js';

// Import middleware
import { errorHandler } from './middleware/error-handler.js';

// Import database connection and logger
import { connectDB, logger } from './config/db.js';

// Create Express application
const app = express();

// Global middlewares
app.use(helmet()); // Security headers
app.use(
  cors({
    origin: secret.corsOrigin || 'http://localhost:3000',
    credentials: true,
  })
);

// Cross-origin resource sharing
app.use(compression()); // Gzip compression
app.use(express.json({ limit: '10mb' })); // JSON body parsing
app.use(express.urlencoded({ extended: true })); // URL-encoded body parsing

// Request logging
if (secret.nodeEnv === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Health check route
app.use('/', healthRoutes);

// Root route
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'API is running',
  });
});

// Document upload routes (global)
app.use('/api/v1', documentRoutes);

// Payment routes (global)
app.use('/api/v1/payment', paymentRoutes);

// Turkey Visa API routes
app.use('/api/v1/turkey', turkeyVisaRoutes);
// 404 handler for undefined routes
// app.use('*', (req, res) => {
//   res.status(404).json({
//     success: false,
//     error: {
//       code: 'NOT_FOUND',
//       message: 'Route not found',
//     },
//   });
// });

// Global error handling middleware (must be last)
app.use(errorHandler);

// Database connection for Vercel serverless
let isConnected = false;

const connectToDatabase = async () => {
  if (!isConnected) {
    try {
      await connectDB();
      isConnected = true;
      logger.info('Database connected successfully');
    } catch (error) {
      logger.error('Database connection failed:', error.message);
      throw error;
    }
  }
};

// Middleware to ensure database connection
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (error) {
    logger.error('Database connection middleware error:', error.message);
    return res.status(500).json({
      success: false,
      error: {
        code: 'DATABASE_ERROR',
        message: 'Database connection failed',
      },
    });
  }
});

// For Vercel deployment - export the app as a serverless function
export default app;

// Local development server startup
if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;

  const startServer = async () => {
    try {
      // Connect to database first
      await connectToDatabase();

      app.listen(PORT, () => {
        logger.info(
          `🚀 Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`
        );
        logger.info(
          `📊 Health check available at: http://localhost:${PORT}/health`
        );
        logger.info(
          `🔐 Better Auth available at: http://localhost:${PORT}/api/auth`
        );
      });
    } catch (error) {
      logger.error('❌ Failed to start server:', error.message);
      process.exit(1);
    }
  };

  startServer();
}
