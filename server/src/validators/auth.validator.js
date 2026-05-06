// ─────────────────────────────────────────────────────────────
// FILE: src/validators/auth.validator.js
// PURPOSE: Define Joi validation schemas for auth request bodies
// WHY: Validate input at the route boundary BEFORE it reaches
//      the controller/service/database. Catch bad data early.
//
// JOI = JavaScript Object Inspection
// It lets you describe the SHAPE and RULES of expected data,
// then validates any object against those rules.
// ─────────────────────────────────────────────────────────────

const Joi = require("joi");

/**
 * registerSchema — Rules for POST /api/auth/register body
 */
const registerSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(50)
    .required()
    .messages({
      "string.min": "Name must be at least 2 characters",
      "string.max": "Name cannot exceed 50 characters",
      "any.required": "Name is required",
    }),

  email: Joi.string()
    .email({ tlds: { allow: false } }) // validate format, don't check TLD
    .lowercase()
    .required()
    .messages({
      "string.email": "Please provide a valid email address",
      "any.required": "Email is required",
    }),

  password: Joi.string()
    .min(8)
    .max(50)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)  // must have upper, lower, number
    .required()
    .messages({
      "string.min": "Password must be at least 8 characters",
      "string.pattern.base":
        "Password must contain at least one uppercase letter, one lowercase letter, and one number",
      "any.required": "Password is required",
    }),

  role: Joi.string()
    .valid("admin", "teacher", "student")
    .required()
    .messages({
      "any.only": "Role must be admin, teacher, or student",
      "any.required": "Role is required",
    }),

  phone: Joi.string()
    .pattern(/^[0-9]{10}$/)
    .optional()
    .messages({
      "string.pattern.base": "Phone must be a 10-digit number",
    }),
});

/**
 * loginSchema — Rules for POST /api/auth/login body
 */
const loginSchema = Joi.object({
  email: Joi.string().email({ tlds: { allow: false } }).required().messages({
    "string.email": "Please provide a valid email",
    "any.required": "Email is required",
  }),

  password: Joi.string().required().messages({
    "any.required": "Password is required",
  }),
});

/**
 * changePasswordSchema — Rules for PUT /api/auth/change-password
 */
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      "string.min": "New password must be at least 8 characters",
      "string.pattern.base":
        "Password must contain uppercase, lowercase, and number",
    }),
});

module.exports = { registerSchema, loginSchema, changePasswordSchema };
