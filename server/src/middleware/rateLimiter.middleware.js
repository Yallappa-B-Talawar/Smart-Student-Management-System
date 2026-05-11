// ─────────────────────────────────────────────────────────────
// FILE: src/middleware/rateLimiter.middleware.js
// PURPOSE: Prevent brute-force and abuse attacks
// WHY: Without rate limiting, anyone can send 10,000 requests
//      to your login endpoint in seconds, trying every possible
//      password combination (brute-force attack). Rate limiting
//      says "max 100 requests per 15 minutes per IP address".
// ─────────────────────────────────────────────────────────────

const rateLimit = require("express-rate-limit");

/**
 * generalLimiter — Applied to all API routes
 * Disabled for development/testing
 */
const generalLimiter = (req, res, next) => next();

/**
 * authLimiter — Applied ONLY to auth routes (login, register)
 * Disabled for development/testing
 */
const authLimiter = (req, res, next) => next();

module.exports = { generalLimiter, authLimiter };
