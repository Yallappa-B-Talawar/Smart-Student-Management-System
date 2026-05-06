// ─────────────────────────────────────────────────────────────
// FILE: src/middleware/error.middleware.js
// PURPOSE: Global error handler — catches ALL errors from the app
// WHY: Express has a special 4-parameter middleware signature:
//      (err, req, res, next). When any code calls next(error)
//      or throws inside asyncHandler, Express routes it here.
//      This is the SINGLE place where we format all error responses.
//
// POSITION: Must be registered LAST in app.js (after all routes)
// ─────────────────────────────────────────────────────────────

const ApiError = require("../utils/ApiError");
const env = require("../config/env");

/**
 * errorHandler — Express global error handling middleware
 *
 * FLOW:
 * 1. Any error thrown anywhere → next(err) called
 * 2. Express sees 4 params → routes to THIS function
 * 3. We check what type of error it is
 * 4. We format it consistently and send response
 */
const errorHandler = (err, req, res, next) => {
  // Start with the error as-is, then normalize it
  let error = err;

  // ── Case 1: Custom ApiError (we threw it ourselves) ────────
  // Nothing to transform — it already has statusCode and message
  if (!(error instanceof ApiError)) {
    // ── Case 2: Mongoose CastError ─────────────────────────
    // Happens when you pass an invalid MongoDB ObjectId
    // Example: GET /students/not-a-valid-id
    if (err.name === "CastError") {
      error = new ApiError(400, `Invalid ${err.path}: ${err.value}`);
    }

    // ── Case 3: Mongoose Duplicate Key ─────────────────────
    // Happens when you try to insert a duplicate unique field
    // Example: register with an email that already exists
    else if (err.code === 11000) {
      const field = Object.keys(err.keyValue)[0]; // e.g., "email"
      error = new ApiError(409, `${field} already exists`);
    }

    // ── Case 4: Mongoose Validation Error ──────────────────
    // Happens when Mongoose schema validation fails
    // (different from Joi — this is at the model level)
    else if (err.name === "ValidationError") {
      const messages = Object.values(err.errors).map((e) => e.message);
      error = new ApiError(400, messages.join(", "));
    }

    // ── Case 5: JWT Errors ─────────────────────────────────
    else if (err.name === "JsonWebTokenError") {
      error = new ApiError(401, "Invalid token. Please log in again.");
    }

    else if (err.name === "TokenExpiredError") {
      error = new ApiError(401, "Token expired. Please log in again.");
    }

    // ── Case 6: Unknown error ──────────────────────────────
    else {
      error = new ApiError(
        err.statusCode || 500,
        err.message || "Internal Server Error"
      );
    }
  }

  // Log the full error in development (for debugging)
  // In production, we'd use a proper logger (like winston)
  if (env.isDev) {
    console.error("🔴 Error:", err);
  }

  // Send the formatted error response
  res.status(error.statusCode).json({
    success: false,
    message: error.message,
    errors: error.errors,
    // Only include stack trace in development (never in production!)
    ...(env.isDev && { stack: err.stack }),
  });
};

module.exports = errorHandler;
