import { constants } from '../config/constants.js';
import { env } from '../config/env.js';

export function errorHandler(err, req, res, next) {
  // Log the error
  console.error(`❌ Error: ${err.message}`, {
    stack: err.stack,
    path: req.path,
    method: req.method,
    body: req.body
  });

  // Default error response
  const response = {
    error: constants.ERRORS.INTERNAL_ERROR,
    message: err.message || 'An unexpected error occurred'
  };

  // Add details if available
  if (err.details) {
    response.details = err.details;
  }

  // Include stack trace in development only
  if (env.isDevelopment && err.stack) {
    response.stack = err.stack;
  }

  // Determine status code
  let statusCode = err.statusCode || 500;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
    response.error = constants.ERRORS.VALIDATION_FAILED;
  }

  if (err.name === 'MongoServerError' && err.code === 11000) {
    statusCode = 409;
    response.error = 'Duplicate entry';
    response.message = 'A record with this value already exists';
  }

  if (err.name === 'CastError') {
    statusCode = 400;
    response.error = 'Invalid ID format';
    response.message = 'The provided ID is invalid';
  }

  if (err.message === constants.ERRORS.PROJECT_NOT_FOUND) {
    statusCode = 404;
    response.error = constants.ERRORS.PROJECT_NOT_FOUND;
  }

  if (err.message === constants.ERRORS.ENDPOINT_NOT_FOUND) {
    statusCode = 404;
    response.error = constants.ERRORS.ENDPOINT_NOT_FOUND;
  }

  if (err.message === constants.ERRORS.INVALID_API_KEY) {
    statusCode = 401;
    response.error = constants.ERRORS.INVALID_API_KEY;
  }

  if (err.message === constants.ERRORS.UNAUTHORIZED) {
    statusCode = 401;
    response.error = constants.ERRORS.UNAUTHORIZED;
  }

  res.status(statusCode).json(response);
}

// Custom error classes
export class AppError extends Error {
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message, details = null) {
    super(message, 400, details);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(message) {
    super(message, 404);
    this.name = 'NotFoundError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message) {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ConflictError extends AppError {
  constructor(message) {
    super(message, 409);
    this.name = 'ConflictError';
  }
}