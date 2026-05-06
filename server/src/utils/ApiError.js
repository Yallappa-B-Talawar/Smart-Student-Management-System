// ─────────────────────────────────────────────────────────────
// FILE: src/utils/ApiError.js
// PURPOSE: Custom error class for consistent error responses
// WHY: JavaScript has a built-in Error class, but it doesn't
//      carry HTTP status codes. By extending it, we create errors
//      that know their own HTTP status (404, 400, 403, 500 etc.).
//      This lets us throw errors anywhere in the codebase and
//      the global error handler will format them consistently.
// ─────────────────────────────────────────────────────────────

/**
 * ApiError extends the built-in JavaScript Error class
 *
 * REAL-WORLD ANALOGY:
 * Think of it like a hospital error report. A normal "Error" just
 * says "something went wrong". An ApiError says:
 * - WHAT went wrong (message)
 * - HOW BAD it is (statusCode: 404, 400, 500...)
 * - WHAT SPECIFICALLY failed (errors: [field details])
 */
class ApiError extends Error {
  /**
   * @param {number} statusCode  - HTTP status code (400, 401, 403, 404, 500)
   * @param {string} message     - Human-readable error description
   * @param {Array}  errors      - Detailed field-level errors (from validation)
   */
  constructor(statusCode, message, errors = []) {
    // Call the parent Error class constructor with the message
    // This sets this.message = message and this.stack (stack trace)
    super(message);

    // HTTP status code — sent as response status
    this.statusCode = statusCode;

    // Always false for errors (helps frontend check success)
    this.success = false;

    // Array of detailed errors (e.g., from Joi validation)
    // Example: [{ field: "email", message: "must be a valid email" }]
    this.errors = errors;

    // Captures the call stack at the point where the error was created
    // Helps with debugging — shows exactly where error originated
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
