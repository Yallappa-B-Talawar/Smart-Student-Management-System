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
 * Allows 100 requests per 15 minutes per IP
 * Covers normal browsing usage patterns
 */
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes in milliseconds
  max: 100,                  // max 100 requests per windowMs
  standardHeaders: true,     // Return rate limit info in RateLimit-* headers
  legacyHeaders: false,      // Disable X-RateLimit-* headers (old format)
  message: {
    success: false,
    message: "Too many requests from this IP. Please try again after 15 minutes.",
  },
});

/**
 * authLimiter — Applied ONLY to auth routes (login, register)
 * Much stricter: only 10 attempts per 15 minutes
 * Why? Login is the most attacked endpoint
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Too many login attempts. Please try again after 15 minutes.",
  },
});

module.exports = { generalLimiter, authLimiter };
