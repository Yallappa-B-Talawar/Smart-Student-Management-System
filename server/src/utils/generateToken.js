// ─────────────────────────────────────────────────────────────
// FILE: src/utils/generateToken.js
// PURPOSE: Generate JWT access and refresh tokens
//
// HOW JWT WORKS (Real-World Analogy):
// JWT is like a movie ticket. When you buy a ticket (login),
// the theater (server) prints your seat number and movie name
// on it (payload). Every time you enter a screen (make a request),
// the usher (auth middleware) checks if the ticket is valid
// and not expired. The ticket is SIGNED — so nobody can forge one.
//
// A JWT has 3 parts separated by dots: header.payload.signature
//   Header:    algorithm used (HS256)
//   Payload:   data (userId, role) + expiry time
//   Signature: HMAC hash of header+payload using SECRET key
// ─────────────────────────────────────────────────────────────

const jwt = require("jsonwebtoken");
const env = require("../config/env");

/**
 * generateAccessToken — Short-lived token for API requests
 *
 * @param {Object} user - The user document from MongoDB
 * @returns {string} - Signed JWT string
 *
 * WHY SHORT-LIVED (15 min)?
 * If someone steals this token, they can only use it for 15 minutes.
 * After that, they'd need the refresh token (which is in an httpOnly
 * cookie they can't access via JavaScript).
 */
const generateAccessToken = (user) => {
  return jwt.sign(
    {
      // Payload — data embedded in the token
      id: user._id,        // MongoDB document ID
      role: user.role,      // "admin", "teacher", or "student"
      email: user.email,
    },
    env.jwt.accessSecret,   // Secret key — NEVER expose this
    {
      expiresIn: env.jwt.accessExpiry, // "15m" from .env
    }
  );
};

/**
 * generateRefreshToken — Long-lived token ONLY used to get new access tokens
 *
 * @param {Object} user - The user document from MongoDB
 * @returns {string} - Signed JWT string
 *
 * WHY SEPARATE SECRET?
 * If someone finds the access secret, they still can't forge refresh
 * tokens (different secret). Defense in depth.
 *
 * WHY ONLY userId IN PAYLOAD?
 * Refresh tokens are only used to issue new access tokens.
 * They don't need role/email — we'll fetch fresh data from DB.
 */
const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user._id,         // Only the user ID — minimal payload
    },
    env.jwt.refreshSecret,  // DIFFERENT secret than access token
    {
      expiresIn: env.jwt.refreshExpiry, // "7d" from .env
    }
  );
};

module.exports = { generateAccessToken, generateRefreshToken };
