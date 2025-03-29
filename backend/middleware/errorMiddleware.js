// Simple utility to create custom error objects (optional but helpful)
// class ErrorResponse extends Error {
//     constructor(message, statusCode) {
//         super(message);
//         this.statusCode = statusCode;
//     }
// }

const errorHandler = (err, req, res, next) => {
    // Log the error for the developer (consider using a more robust logger like Winston in production)
    console.error('--------------------');
    console.error('Error Name:', err.name);
    console.error('Error Message:', err.message);
    console.error('Error Stack:', err.stack);
    console.error('--------------------');

    let error = { ...err }; // Create a copy to avoid modifying the original err object directly
    error.message = err.message; // Ensure message property is copied

    // Initialize default status code and message
    let statusCode = err.statusCode || 500; // Default to 500 Internal Server Error
    let message = err.message || 'Server Error';

    // Handle specific Mongoose errors
    // Mongoose bad ObjectId (e.g., invalid ID format passed in URL)
    if (err.name === 'CastError') {
        message = `Resource not found. Invalid ID format for path: ${err.path}`;
        statusCode = 404; // Not Found
    }

    // Mongoose duplicate key (e.g., trying to register an email that already exists)
    if (err.code === 11000) {
        // Extract the field name that caused the duplicate error
        const field = Object.keys(err.keyValue)[0];
        message = `Duplicate field value entered for '${field}'. Please use another value.`;
        statusCode = 400; // Bad Request
    }

    // Mongoose validation error (e.g., missing required fields, enum validation fails)
    if (err.name === 'ValidationError') {
        // Combine messages from all validation errors
        message = Object.values(err.errors).map(val => val.message).join(', ');
        statusCode = 400; // Bad Request
    }

    // Handle potential JWT errors (will add more specific ones later if needed)
    if (err.name === 'JsonWebTokenError') {
         message = 'Invalid token. Please log in again.';
         statusCode = 401; // Unauthorized
    }
    if (err.name === 'TokenExpiredError') {
         message = 'Your session has expired. Please log in again.';
         statusCode = 401; // Unauthorized
    }


    // Send the standardized error response
    res.status(statusCode).json({
        success: false,
        message: message,
        // Optionally include stack trace in development environment only
        // stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
};

module.exports = errorHandler;
// module.exports = { errorHandler, ErrorResponse }; // Export ErrorResponse if you defined and used it