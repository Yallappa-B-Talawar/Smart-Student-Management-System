// ─────────────────────────────────────────────────────────────
// FILE: src/routes/auth.routes.js
// PURPOSE: Define URL patterns for authentication endpoints
//
// MIDDLEWARE CHAIN (for a protected route):
// Request → rateLimiter → protect → authorize → validate → controller
//
// Each middleware is like a checkpoint. If any one fails,
// the request is rejected and the controller never runs.
// ─────────────────────────────────────────────────────────────

const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const { authLimiter } = require("../middleware/rateLimiter.middleware");
const { protect } = require("../middleware/auth.middleware");
const validate = require("../middleware/validate.middleware");
const {
  registerSchema,
  loginSchema,
  changePasswordSchema,
} = require("../validators/auth.validator");

// ── Public Routes (no auth required) ────────────────────────

// POST /api/auth/register
// Chain: rateLimiter → validate body → register controller
router.post("/register", authLimiter, validate(registerSchema), authController.register);

// POST /api/auth/login
// Chain: rateLimiter → validate body → login controller
router.post("/login", authLimiter, validate(loginSchema), authController.login);

// POST /api/auth/refresh
// Chain: refreshToken controller (reads cookie internally)
router.post("/refresh", authController.refreshToken);

// ── Protected Routes (JWT required) ─────────────────────────

// POST /api/auth/logout
// Chain: protect (verify JWT) → logout controller
router.post("/logout", protect, authController.logout);

// GET /api/auth/me
// Chain: protect → getMe controller
router.get("/me", protect, authController.getMe);

// PUT /api/auth/change-password
// Chain: protect → validate body → changePassword controller
router.put(
  "/change-password",
  protect,
  validate(changePasswordSchema),
  authController.changePassword
);

module.exports = router;
