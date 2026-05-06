// ─────────────────────────────────────────────────────────────
// FILE: src/config/env.js
// PURPOSE: Validate and export all environment variables
// WHY: Instead of using process.env.X directly everywhere in
//      the code, we centralize it here. If a variable is missing,
//      the app crashes immediately at startup with a clear error —
//      not silently fail at runtime when a request comes in.
// ─────────────────────────────────────────────────────────────

// Load .env file values into process.env
// Must be called BEFORE reading any process.env values
require("dotenv").config();

// Define all required environment variables
// If any is missing, throw an error NOW (fail fast principle)
const requiredVars = [
  "MONGO_URI",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
];

requiredVars.forEach((varName) => {
  if (!process.env[varName]) {
    throw new Error(
      `FATAL: Missing required environment variable: ${varName}\n` +
      `Please check your .env file.`
    );
  }
});

// Export a clean, named config object
// Now every file imports from here — not from process.env directly
const env = {
  port: process.env.PORT || 5000,
  nodeEnv: process.env.NODE_ENV || "development",
  mongoUri: process.env.MONGO_URI,
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiry: process.env.JWT_ACCESS_EXPIRY || "15m",
    refreshExpiry: process.env.JWT_REFRESH_EXPIRY || "7d",
  },
  cors: {
    origin: process.env.CORS_ORIGIN || "http://localhost:5173",
  },
  clientUrl: process.env.CLIENT_URL || "http://localhost:5173",
  isDev: process.env.NODE_ENV === "development",
  isProd: process.env.NODE_ENV === "production",
};

module.exports = env;
