const logger = require('../config/logger');

const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    user: req.user?.id || 'anonymous'
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = {
      success: false,
      message,
      statusCode: 404
    };
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`;
    error = {
      success: false,
      message,
      statusCode: 400
    };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const messages = Object.values(err.errors).map(val => val.message);
    error = {
      success: false,
      message: messages.join(', '),
      statusCode: 400,
      errors: messages
    };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = {
      success: false,
      message: 'Invalid token',
      statusCode: 401
    };
  }

  if (err.name === 'TokenExpiredError') {
    error = {
      success: false,
      message: 'Token expired',
      statusCode: 401
    };
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = {
      success: false,
      message: 'File too large',
      statusCode: 400
    };
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    error = {
      success: false,
      message: 'Too many files',
      statusCode: 400
    };
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = {
      success: false,
      message: 'Unexpected file field',
      statusCode: 400
    };
  }

  // Stripe errors
  if (err.type === 'StripeCardError') {
    error = {
      success: false,
      message: err.message || 'Payment failed',
      statusCode: 400,
      paymentError: true
    };
  }

  if (err.type === 'StripeInvalidRequestError') {
    error = {
      success: false,
      message: 'Invalid payment request',
      statusCode: 400,
      paymentError: true
    };
  }

  // Rate limit errors
  if (err.status === 429) {
    error = {
      success: false,
      message: 'Too many requests, please try again later',
      statusCode: 429,
      retryAfter: err.retryAfter || 900
    };
  }

  // Default error response
  const response = {
    success: false,
    message: error.message || 'Server Error',
    ...(error.errors && { errors: error.errors }),
    ...(error.paymentError && { paymentError: true }),
    ...(error.retryAfter && { retryAfter: error.retryAfter })
  };

  // Add error details in development
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    response.error = err;
  }

  // Add request ID for tracking
  if (req.id) {
    response.requestId = req.id;
  }

  res.status(error.statusCode || 500).json(response);
};

// Async error handler wrapper
const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

// Custom error class
class ErrorResponse extends Error {
  constructor(message, statusCode, errors = null) {
    super(message);
    this.statusCode = statusCode;
    this.errors = errors;
    this.success = false;
  }
}

// Not found middleware
const notFound = (req, res, next) => {
  const error = new ErrorResponse(
    `Not found - ${req.originalUrl}`,
    404
  );
  next(error);
};

// Validation error handler
const validationErrorHandler = (errors) => {
  const formattedErrors = {};
  
  errors.forEach(error => {
    const field = error.param;
    if (!formattedErrors[field]) {
      formattedErrors[field] = [];
    }
    formattedErrors[field].push(error.msg);
  });

  return new ErrorResponse(
    'Validation failed',
    400,
    formattedErrors
  );
};

module.exports = {
  errorHandler,
  asyncHandler,
  ErrorResponse,
  notFound,
  validationErrorHandler
};
