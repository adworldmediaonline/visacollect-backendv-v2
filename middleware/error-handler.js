import { logger } from '../config/db.js';

// Custom Error class for operational errors
export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    Error.captureStackTrace(this, this.constructor);
  }
}

// Handle MongoDB/Mongoose errors
const handleMongooseError = (error) => {
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map((err) => err.message);
    return new AppError(`Validation Error: ${errors.join('. ')}`, 400);
  }

  if (error.name === 'CastError') {
    return new AppError('Invalid data format', 400);
  }

  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return new AppError(`Duplicate field value: ${field}`, 400);
  }

  return new AppError('Database error', 500);
};

// Handle JWT errors
const handleJWTError = () =>
  new AppError('Invalid token. Please log in again!', 401);

const handleJWTExpiredError = () =>
  new AppError('Your token has expired! Please log in again.', 401);

// Send error response in development
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    error: {
      code: err.status || 'INTERNAL_SERVER_ERROR',
      message: err.message,
      stack: err.stack,
      ...(err.errors && { details: err.errors }),
    },
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
    }),
  });
};

// Send error response in production
const sendErrorProd = (err, res) => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      error: {
        code: err.status || 'INTERNAL_SERVER_ERROR',
        message: err.message,
      },
    });
  } else {
    // Programming or other unknown error: don't leak error details
    logger.error('ERROR 💥', err);

    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Something went wrong!',
      },
    });
  }
};

// Global error handler middleware
export const errorHandler = (err, req, res, _next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
  });

  // Handle specific error types
  if (
    err.name === 'ValidationError' ||
    err.name === 'CastError' ||
    err.code === 11000
  ) {
    error = handleMongooseError(err);
  }

  if (err.name === 'JsonWebTokenError') {
    error = handleJWTError();
  }

  if (err.name === 'TokenExpiredError') {
    error = handleJWTExpiredError();
  }

  // Send appropriate error response
  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(error, res);
  } else {
    sendErrorProd(error, res);
  }
};

// Async error wrapper
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Validation error handler for Zod
export const handleValidationError = (error) => {
  // Extract validation errors (could be used for detailed error logging)
  error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));

  return new AppError('Validation failed', 400, true);
};
