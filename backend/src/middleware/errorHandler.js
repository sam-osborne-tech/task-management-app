/**
 * Centralized error handling middleware.
 * Provides consistent error responses across the API.
 */

/**
 * Custom API Error class for operational errors.
 */
export class ApiError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Creates a Not Found error.
 * @param {string} resource - The resource type that wasn't found
 */
export const notFound = (resource = 'Resource') => {
  return new ApiError(404, `${resource} not found`);
};

/**
 * Creates a Bad Request error.
 * @param {string} message - The error message
 */
export const badRequest = (message = 'Bad request') => {
  return new ApiError(400, message);
};

/**
 * Global error handling middleware.
 * Catches all errors and returns consistent JSON responses.
 */
export const errorHandler = (err, req, res, next) => {
  // Log the error for debugging
  console.error(`[ERROR] ${new Date().toISOString()}:`, {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.path,
    method: req.method
  });

  // Handle known API errors
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      success: false,
      error: err.message
    });
  }

  // Handle JSON parse errors
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({
      success: false,
      error: 'Invalid JSON in request body'
    });
  }

  // Handle unexpected errors
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'An unexpected error occurred'
    : err.message;

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

/**
 * Async handler wrapper to catch errors in async route handlers.
 * @param {Function} fn - The async route handler function
 */
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};
