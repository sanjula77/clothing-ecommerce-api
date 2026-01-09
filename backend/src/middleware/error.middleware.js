import { AppError } from "../utils/AppError.js";

// Error handling middleware
export const errorHandler = (err, req, res, _next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging (skip in test environment to reduce noise)
  if (process.env.NODE_ENV !== "test") {
    console.error(err);
  }

  // AppError (custom errors)
  if (err instanceof AppError) {
    const response = {
      success: false,
      error: err.message,
    };
    // Include error details if available
    if (err.details && Array.isArray(err.details)) {
      response.details = err.details;
    }
    return res.status(err.statusCode).json(response);
  }

  // Mongoose bad ObjectId
  if (err.name === "CastError") {
    const message = "Resource not found";
    error = new AppError(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = "Duplicate field value entered";
    error = new AppError(message, 400);
  }

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors)
      .map((val) => val.message)
      .join(", ");
    error = new AppError(message, 400);
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    const message = "Invalid token";
    error = new AppError(message, 401);
  }

  if (err.name === "TokenExpiredError") {
    const message = "Token expired";
    error = new AppError(message, 401);
  }

  // Default error
  const statusCode = error.statusCode || 500;
  const message = error.message || "Server Error";

  res.status(statusCode).json({
    success: false,
    error: message,
  });
};

// Not found middleware
export const notFound = (req, res, next) => {
  const error = new AppError(`Not Found - ${req.originalUrl}`, 404);
  next(error);
};
