// ─────────────────────────────────────────────────────────────
// FILE: src/controllers/auth.controller.js
// PURPOSE: Handle HTTP requests/responses for authentication
//
// CONTROLLER RULES:
// 1. Extract data from req (body, params, query, cookies)
// 2. Call the appropriate service function
// 3. Format and send the response
// 4. NEVER write business logic here
//
// REAL-WORLD ANALOGY:
// The controller is a WAITER in a restaurant.
// Customer (client) tells the waiter what they want (request).
// Waiter writes it down and takes it to the KITCHEN (service).
// Kitchen prepares the food (business logic + database).
// Waiter brings the food back to the customer (response).
// The waiter NEVER cooks — they only communicate.
// ─────────────────────────────────────────────────────────────

const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const authService = require("../services/auth.service");
const env = require("../config/env");

// ── Cookie options for refresh token ────────────────────────
// WHY httpOnly? JavaScript in the browser CANNOT read this cookie.
// Even if an attacker injects malicious JS (XSS attack), they
// can't steal the refresh token. The browser sends it automatically.
const cookieOptions = {
  httpOnly: true,           // JS cannot access (XSS protection)
  secure: env.isProd,       // HTTPS only in production
  sameSite: "strict",       // Don't send cookie on cross-site requests (CSRF protection)
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
};

/**
 * register — POST /api/auth/register
 *
 * REQUEST FLOW:
 * Client sends { name, email, password, role } in body
 * → validate middleware checks body against Joi schema
 * → this controller receives validated data
 * → calls authService.registerUser()
 * → sends back user data + access token + refresh cookie
 */
const register = asyncHandler(async (req, res) => {
  // req.body has been validated and cleaned by validate middleware
  const { user, accessToken, refreshToken } = await authService.registerUser(
    req.body
  );

  // Set refresh token as httpOnly cookie
  // The browser stores this automatically and sends it with every request
  res.cookie("refreshToken", refreshToken, cookieOptions);

  // Send the response with 201 (Created)
  // Access token goes in the JSON body — frontend stores in memory/state
  const response = new ApiResponse(201, "Registration successful", {
    user,
    accessToken,
  });

  res.status(response.statusCode).json(response);
});

/**
 * login — POST /api/auth/login
 *
 * REQUEST FLOW:
 * Client sends { email, password }
 * → validate middleware checks body
 * → this controller calls authService.loginUser()
 * → sends back user data + access token + refresh cookie
 */
const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const { user, accessToken, refreshToken } = await authService.loginUser(
    email,
    password
  );

  // Set refresh token cookie
  res.cookie("refreshToken", refreshToken, cookieOptions);

  const response = new ApiResponse(200, "Login successful", {
    user,
    accessToken,
  });

  res.status(response.statusCode).json(response);
});

/**
 * refreshToken — POST /api/auth/refresh
 *
 * REQUEST FLOW:
 * Browser automatically sends the httpOnly cookie
 * → we read it from req.cookies.refreshToken
 * → authService validates and rotates tokens
 * → new access token in body, new refresh token in cookie
 */
const refreshToken = asyncHandler(async (req, res) => {
  // Read refresh token from the httpOnly cookie
  const token = req.cookies.refreshToken;

  const { accessToken, refreshToken: newRefreshToken } =
    await authService.refreshAccessToken(token);

  // Set the NEW refresh token as a cookie (rotation)
  res.cookie("refreshToken", newRefreshToken, cookieOptions);

  const response = new ApiResponse(200, "Token refreshed successfully", {
    accessToken,
  });

  res.status(response.statusCode).json(response);
});

/**
 * logout — POST /api/auth/logout
 *
 * REQUEST FLOW:
 * → auth middleware verifies JWT and attaches req.user
 * → this controller calls authService.logoutUser()
 * → clears the refresh token cookie
 * → clears refresh token from database
 */
const logout = asyncHandler(async (req, res) => {
  // Invalidate refresh token in database
  await authService.logoutUser(req.user.id);

  // Clear the refresh token cookie from the browser
  res.clearCookie("refreshToken", cookieOptions);

  const response = new ApiResponse(200, "Logged out successfully");
  res.status(response.statusCode).json(response);
});

/**
 * getMe — GET /api/auth/me
 *
 * Returns the currently logged-in user's profile.
 * req.user.id comes from the JWT payload (set by auth middleware)
 */
const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.id);

  const response = new ApiResponse(200, "Profile retrieved", user);
  res.status(response.statusCode).json(response);
});

/**
 * changePassword — PUT /api/auth/change-password
 */
const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  const result = await authService.changePassword(
    req.user.id,
    currentPassword,
    newPassword
  );

  const response = new ApiResponse(200, result.message);
  res.status(response.statusCode).json(response);
});

module.exports = {
  register,
  login,
  refreshToken,
  logout,
  getMe,
  changePassword,
};
