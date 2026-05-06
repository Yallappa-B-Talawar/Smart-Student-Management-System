// ─────────────────────────────────────────────────────────────
// FILE: src/middleware/auth.middleware.js
// PURPOSE: Verify JWT token and attach user info to req.user
//
// HOW IT WORKS:
// Every protected API request must include an access token in
// the Authorization header: "Bearer eyJhbGciOi..."
//
// This middleware:
// 1. Extracts the token from the header
// 2. Verifies it using the secret key
// 3. Decodes the payload (userId, role, email)
// 4. Attaches it to req.user so controllers can use it
//
// REAL-WORLD ANALOGY:
// This is the SECURITY GUARD at a building entrance.
// You show your ID badge (token). The guard scans it (verify).
// If valid, you're allowed in and the guard notes who you are
// (req.user). If fake or expired, you're turned away (401).
// ─────────────────────────────────────────────────────────────

const jwt = require("jsonwebtoken");
const ApiError = require("../utils/ApiError");
const env = require("../config/env");

/**
 * protect — Verifies JWT and attaches decoded payload to req.user
 *
 * After this middleware runs successfully, every downstream
 * controller/middleware can access:
 *   req.user.id    → MongoDB user ID
 *   req.user.role  → "admin", "teacher", or "student"
 *   req.user.email → user's email
 */
const protect = (req, res, next) => {
  // Step 1: Get the token from the Authorization header
  // Format: "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6..."
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    throw new ApiError(401, "Access denied. No token provided.");
  }

  // Split "Bearer eyJabc..." → ["Bearer", "eyJabc..."] → take [1]
  const token = authHeader.split(" ")[1];

  if (!token) {
    throw new ApiError(401, "Access denied. Token is empty.");
  }

  // Step 2: Verify and decode the token
  try {
    // jwt.verify() does TWO things:
    // a) Checks if the signature is valid (not tampered)
    // b) Checks if the token has expired
    // If both pass, it returns the decoded payload
    const decoded = jwt.verify(token, env.jwt.accessSecret);

    // Step 3: Attach user info to the request object
    // Now req.user is available in all subsequent middleware/controllers
    req.user = {
      id: decoded.id,
      role: decoded.role,
      email: decoded.email,
    };

    // Proceed to the next middleware/controller
    next();
  } catch (error) {
    // jwt.verify throws specific error types:
    // - TokenExpiredError: token has passed its expiry
    // - JsonWebTokenError: token is invalid/tampered
    // Both are caught by our global error handler (error.middleware.js)
    // which formats them as 401 responses
    throw new ApiError(401, "Invalid or expired token");
  }
};

module.exports = { protect };
