const { sendError } = require("../utils/response");

// Must have 4 parameters for Express to recognize it as error handler
const globalErrorHandler = (err, req, res, next) => {
  // Log error details server-side
  console.error(`[ERROR] ${err.code || "INTERNAL"} | ${req.method} ${req.originalUrl} | ${err.message}`);
  if (process.env.NODE_ENV === "development") {
    console.error(err.stack);
  }

  // Handle Mongoose CastError (invalid ObjectId)
  if (err.name === "CastError") {
    return sendError(res, 404, "NOT_FOUND", `Invalid ID format: ${err.value}`);
  }

  // Handle Mongoose duplicate key error
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return sendError(res, 409, "EMAIL_ALREADY_EXISTS", `An account with this ${field} already exists.`);
  }

  // Handle Mongoose validation error
  if (err.name === "ValidationError") {
    const message = Object.values(err.errors).map((e) => e.message).join(". ");
    return sendError(res, 400, "INVALID_INPUT", message);
  }

  // Handle our own operational AppErrors
  if (err.isOperational) {
    return sendError(res, err.statusCode, err.code, err.message);
  }

  // Unknown/unhandled errors — don't leak details in production
  return sendError(
    res,
    500,
    "INTERNAL_SERVER_ERROR",
    process.env.NODE_ENV === "development" ? err.message : "An unexpected error occurred. Please try again."
  );
};

module.exports = globalErrorHandler;
