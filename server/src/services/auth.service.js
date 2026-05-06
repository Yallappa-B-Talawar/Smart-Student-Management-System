// ─────────────────────────────────────────────────────────────
// FILE: src/services/auth.service.js
// PURPOSE: ALL authentication business logic lives here
//
// WHY SEPARATE FROM CONTROLLER?
// The controller handles HTTP (req, res). The service handles LOGIC.
// This means:
//   1. Services can be reused (e.g., create user from admin panel too)
//   2. Services are testable without HTTP (just call the function)
//   3. If you switch from Express to Fastify, services don't change
//
// REAL-WORLD ANALOGY:
// Controller = the bank teller (talks to customer, fills forms)
// Service = the bank's backend system (processes the transaction)
// The teller doesn't calculate interest — the system does.
// ─────────────────────────────────────────────────────────────

const User = require("../models/User");
const ApiError = require("../utils/ApiError");
const {
  generateAccessToken,
  generateRefreshToken,
} = require("../utils/generateToken");
const jwt = require("jsonwebtoken");
const env = require("../config/env");

/**
 * registerUser — Creates a new user account
 *
 * FLOW:
 * 1. Check if email already exists (prevent duplicates)
 * 2. Create User document (password auto-hashed by pre-save hook)
 * 3. Generate tokens
 * 4. Save refresh token to database
 * 5. Return user data + tokens
 *
 * @param {Object} userData - { name, email, password, role, phone }
 * @returns {Object} - { user, accessToken, refreshToken }
 */
const registerUser = async (userData) => {
  // Step 1: Check for existing user
  const existingUser = await User.findOne({ email: userData.email });
  if (existingUser) {
    // 409 = Conflict (resource already exists)
    throw new ApiError(409, "An account with this email already exists");
  }

  // Step 2: Create user in database
  // The password is hashed automatically by the pre-save hook in User.js
  // We don't need to hash it here — that's the beauty of Mongoose hooks
  const user = await User.create(userData);

  // Step 3: Generate both tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Step 4: Store refresh token in database
  // WHY? So we can invalidate it on logout (server-side logout)
  // Without this, a stolen refresh token works until it expires
  user.refreshToken = refreshToken;
  user.lastLogin = new Date();

  // validateBeforeSave: false → skip validation (password already hashed,
  // would fail the "minlength: 8" check because hash is 60+ chars)
  await user.save({ validateBeforeSave: false });

  // Step 5: Return clean user object (without password and refreshToken)
  // We manually construct the response to control exactly what's sent
  const userResponse = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    phone: user.phone,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };

  return { user: userResponse, accessToken, refreshToken };
};

/**
 * loginUser — Authenticates a user and returns tokens
 *
 * FLOW:
 * 1. Find user by email (include password field)
 * 2. Check if account is active
 * 3. Compare password with stored hash
 * 4. Generate new tokens
 * 5. Update refresh token and lastLogin in database
 * 6. Return user data + tokens
 *
 * @param {string} email
 * @param {string} password
 * @returns {Object} - { user, accessToken, refreshToken }
 */
const loginUser = async (email, password) => {
  // Step 1: Find user by email
  // .select("+password") overrides "select: false" from schema
  // Without this, password field would be undefined
  const user = await User.findOne({ email }).select("+password +refreshToken");

  if (!user) {
    // 401 = Unauthorized
    // SECURITY: Don't say "email not found" — that reveals which emails exist
    // Always give a vague message for login failures
    throw new ApiError(401, "Invalid email or password");
  }

  // Step 2: Check if account is active
  if (!user.isActive) {
    throw new ApiError(
      403,
      "Your account has been deactivated. Contact admin."
    );
  }

  // Step 3: Compare passwords using bcrypt
  // user.comparePassword() is the instance method we defined in User.js
  const isPasswordCorrect = await user.comparePassword(password);

  if (!isPasswordCorrect) {
    // Same vague message — don't reveal that password specifically was wrong
    throw new ApiError(401, "Invalid email or password");
  }

  // Step 4: Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Step 5: Update database
  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  // Step 6: Return clean response
  const userResponse = {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    phone: user.phone,
    isActive: user.isActive,
    lastLogin: user.lastLogin,
  };

  return { user: userResponse, accessToken, refreshToken };
};

/**
 * refreshAccessToken — Issues a new access token using refresh token
 *
 * FLOW:
 * 1. Verify the refresh token's signature and expiry
 * 2. Find user in database
 * 3. Compare token with stored refresh token (prevents reuse after logout)
 * 4. Generate NEW access token + rotate refresh token
 * 5. Return new tokens
 *
 * WHY ROTATE REFRESH TOKENS?
 * If someone steals a refresh token and uses it, the real user's
 * next refresh will fail (tokens don't match). This signals a breach.
 *
 * @param {string} token - The refresh token from httpOnly cookie
 * @returns {Object} - { accessToken, refreshToken }
 */
const refreshAccessToken = async (token) => {
  if (!token) {
    throw new ApiError(401, "No refresh token provided");
  }

  // Step 1: Verify the token
  let decoded;
  try {
    decoded = jwt.verify(token, env.jwt.refreshSecret);
  } catch (err) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  // Step 2: Find user and get their stored refresh token
  const user = await User.findById(decoded.id).select("+refreshToken");

  if (!user) {
    throw new ApiError(401, "User not found");
  }

  // Step 3: Compare with stored token
  // If they don't match, someone may have stolen the old token
  if (user.refreshToken !== token) {
    // Clear the stored token (force re-login for security)
    user.refreshToken = null;
    await user.save({ validateBeforeSave: false });
    throw new ApiError(401, "Token has been revoked. Please log in again.");
  }

  // Step 4: Generate new tokens (rotation)
  const newAccessToken = generateAccessToken(user);
  const newRefreshToken = generateRefreshToken(user);

  // Step 5: Save new refresh token
  user.refreshToken = newRefreshToken;
  await user.save({ validateBeforeSave: false });

  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
};

/**
 * logoutUser — Invalidates the refresh token (server-side logout)
 *
 * @param {string} userId - The user's MongoDB _id
 */
const logoutUser = async (userId) => {
  // Set refreshToken to null — any future refresh attempts will fail
  await User.findByIdAndUpdate(userId, {
    refreshToken: null,
  });
};

/**
 * getCurrentUser — Returns the authenticated user's profile
 *
 * @param {string} userId - From the JWT payload
 * @returns {Object} - User document (without password)
 */
const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  return user;
};

/**
 * changePassword — Updates the user's password
 *
 * @param {string} userId - From the JWT payload
 * @param {string} currentPassword - Old password for verification
 * @param {string} newPassword - New password to set
 */
const changePassword = async (userId, currentPassword, newPassword) => {
  // Get user WITH password (normally excluded)
  const user = await User.findById(userId).select("+password");

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  // Verify current password
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    throw new ApiError(400, "Current password is incorrect");
  }

  // Set new password (will be hashed by pre-save hook)
  user.password = newPassword;
  await user.save(); // validation runs here — minlength: 8 checked

  return { message: "Password updated successfully" };
};

module.exports = {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getCurrentUser,
  changePassword,
};
