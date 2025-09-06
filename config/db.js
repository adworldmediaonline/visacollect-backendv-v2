import mongoose from 'mongoose';
import winston from 'winston';
import { secret } from './env.js';

const { logLevel, mongodbUri } = secret;

// Check if we're in a serverless environment (Vercel, Netlify, etc.)
const isServerless =
  process.env.VERCEL || process.env.NETLIFY || process.env.LAMBDA_TASK_ROOT;

// Configure Winston logger
const logger = winston.createLogger({
  level: logLevel || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    // Always include console transport
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    // Only add file transports if not in serverless environment
    ...(isServerless
      ? []
      : [
          new winston.transports.File({
            filename: 'logs/error.log',
            level: 'error',
          }),
          new winston.transports.File({
            filename: 'logs/combined.log',
          }),
        ]),
  ],
});

// MongoDB connection options
const connectionOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: isServerless ? 1 : 10, // Reduce pool size for serverless
  serverSelectionTimeoutMS: isServerless ? 10000 : 5000, // Increase timeout for serverless
  socketTimeoutMS: isServerless ? 30000 : 45000, // Reduce socket timeout for serverless
  bufferCommands: false, // Disable mongoose buffering
  bufferMaxEntries: 0, // Disable mongoose buffering
};

// Connect to MongoDB
const connectDB = async () => {
  try {
    logger.info('Attempting to connect to MongoDB...', {
      isServerless,
      mongodbUri: mongodbUri ? 'URI provided' : 'URI missing',
    });

    const conn = await mongoose.connect(mongodbUri, connectionOptions);

    logger.info(`MongoDB Connected: ${conn.connection.host}`, {
      readyState: conn.connection.readyState,
      name: conn.connection.name,
    });

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected');
    });

    mongoose.connection.on('reconnected', () => {
      logger.info('MongoDB reconnected');
    });

    // Graceful shutdown (only for non-serverless)
    if (!isServerless) {
      process.on('SIGINT', async () => {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed through app termination');
        process.exit(0);
      });
    }

    return conn;
  } catch (error) {
    logger.error('MongoDB connection failed:', {
      error: error.message,
      stack: error.stack,
      mongodbUri: mongodbUri ? 'URI provided' : 'URI missing',
    });
    throw error; // Re-throw to let caller handle
  }
};

// Export the connection function and logger
export { connectDB, logger };
export default connectDB;
