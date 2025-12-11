/**
 * Custom error handler middleware
 * 
 * Handles errors from controllers and services, ensuring proper HTTP status codes
 * and clear error messages. Supports custom errors with statusCode property
 * (e.g., 409 for "Slot already booked" from bookingService).
 */
const errorHandler = (err, req, res, next) => {
  // Log error
  console.error('Error:', {
    message: err.message,
    statusCode: err.statusCode,
    status: err.status,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method
  });

  // Determine HTTP status code
  // Priority: statusCode (custom errors) > status (Express errors) > 500 (default)
  const status = err.statusCode || err.status || 500;
  
  // Get error message, defaulting to a helpful message if missing
  const message = err.message || 'Internal Server Error';

  // Build response object - always include error message
  const response = {
    error: message
  };

  // In development mode, include stack trace and error details
  if (process.env.NODE_ENV === 'development') {
    response.stack = err.stack;
    if (err.code) {
      response.code = err.code; // Include Postgres error codes in dev
    }
  }

  // Send error response with appropriate status code
  res.status(status).json(response);
};

module.exports = errorHandler;

