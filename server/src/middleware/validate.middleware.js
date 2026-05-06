// ─────────────────────────────────────────────────────────────
// FILE: src/middleware/validate.middleware.js
// PURPOSE: A reusable middleware factory that validates req.body
//          against any Joi schema you pass in.
//
// WHY A FACTORY?
// Instead of writing validation logic in every route, we create
// ONE middleware that accepts a schema and returns a middleware.
//
// REAL-WORLD ANALOGY:
// Think of airport security. The "validate" function is the security
// checkpoint machine. You load it with different rules (Joi schema)
// for different flights (routes). The machine itself doesn't change —
// only the rules it checks against.
//
// USAGE IN ROUTES:
//   const validate = require("../middleware/validate.middleware");
//   const { registerSchema } = require("../validators/auth.validator");
//   router.post("/register", validate(registerSchema), controller.register);
// ─────────────────────────────────────────────────────────────

const ApiError = require("../utils/ApiError");

/**
 * validate — Middleware factory that returns a validation middleware
 *
 * @param {Joi.ObjectSchema} schema - The Joi schema to validate against
 * @returns {Function} Express middleware function
 *
 * FLOW:
 * 1. Receive the Joi schema (e.g., registerSchema)
 * 2. Return a middleware function (req, res, next)
 * 3. When a request arrives, validate req.body against the schema
 * 4. If valid → call next() (proceed to controller)
 * 5. If invalid → throw ApiError with 400 status and error details
 */
const validate = (schema) => {
  // This returned function IS the actual middleware Express will use
  return (req, res, next) => {
    // schema.validate() checks req.body against the Joi rules
    // Options:
    //   abortEarly: false → collect ALL errors, not just the first one
    //   stripUnknown: true → silently remove fields not in the schema
    //                         (security: prevents extra malicious fields)
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    // If validation failed, Joi provides error.details array
    if (error) {
      // Map Joi's error format to our clean API format
      const errorMessages = error.details.map((detail) => ({
        field: detail.path.join("."),   // e.g., "email" or "address.city"
        message: detail.message,        // e.g., "Email is required"
      }));

      // Throw our custom ApiError — caught by error.middleware.js
      throw new ApiError(400, "Validation failed", errorMessages);
    }

    // Replace req.body with the validated + cleaned value
    // This means the controller receives ONLY valid, sanitized data
    req.body = value;

    // Proceed to the next middleware/controller
    next();
  };
};

module.exports = validate;
