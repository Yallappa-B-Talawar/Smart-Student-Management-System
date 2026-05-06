// ─────────────────────────────────────────────────────────────
// FILE: src/app.js
// PURPOSE: Configure Express application and middleware stack
//
// WHY SEPARATE FROM server.js?
// app.js = Express configuration (middleware, routes, error handling)
// server.js = Starting the server (port, database connection)
//
// This separation lets you import app.js into tests without
// starting an actual server. Industry standard practice.
//
// MIDDLEWARE ORDER MATTERS!
// Express processes middleware top-to-bottom. Security middleware
// must come BEFORE routes, and error handler must come LAST.
//
// Think of it like an assembly line:
//   Raw request → Security check → Parse body → Route matching
//   → Controller → Response   (or)   → Error handler → Response
// ─────────────────────────────────────────────────────────────

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const cookieParser = require("cookie-parser");
const mongoSanitize = require("express-mongo-sanitize");

const env = require("./config/env");
const { generalLimiter } = require("./middleware/rateLimiter.middleware");
const errorHandler = require("./middleware/error.middleware");
const routes = require("./routes");
const ApiError = require("./utils/ApiError");

// Create the Express application
const app = express();

// ─────────────────────────────────────────────────────────────
// MIDDLEWARE STACK (order matters!)
// ─────────────────────────────────────────────────────────────

// 1. HELMET — Sets 11+ security HTTP headers automatically
//    - X-Content-Type-Options: prevents MIME type sniffing
//    - X-Frame-Options: prevents clickjacking
//    - Strict-Transport-Security: forces HTTPS
//    WHY FIRST? Security headers should be on EVERY response
app.use(helmet());

// 2. CORS — Cross-Origin Resource Sharing
//    By default, browsers block requests from different origins
//    (e.g., React on :5173 calling Express on :5000)
//    This tells the browser: "Allow requests from our frontend"
app.use(
  cors({
    origin: env.cors.origin,     // Only allow our frontend URL
    credentials: true,            // Allow cookies to be sent cross-origin
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// 3. RATE LIMITER — Prevent brute-force/DDoS attacks
//    100 requests per 15 minutes per IP address
app.use(generalLimiter);

// 4. BODY PARSERS — Convert raw request body into JavaScript objects
//    express.json() = parse JSON bodies (most API requests)
//    express.urlencoded() = parse form submissions
//    limit: "16kb" = reject payloads larger than 16KB (security)
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

// 5. COOKIE PARSER — Parse cookies from request headers
//    Makes req.cookies available (needed for refresh tokens)
app.use(cookieParser());

// 6. MONGO SANITIZE — Prevent NoSQL injection attacks
//    Removes $ and . from req.body, req.query, req.params
//    Without this, attackers could send: { "email": { "$gt": "" } }
//    Which would match ALL users in MongoDB
app.use(mongoSanitize());

// 7. MORGAN — HTTP request logger (development only)
//    Logs: GET /api/auth/login 200 15ms
//    Helps with debugging — see every request in your terminal
if (env.isDev) {
  app.use(morgan("dev"));
}

// ─────────────────────────────────────────────────────────────
// ROUTES
// ─────────────────────────────────────────────────────────────

// Health check endpoint — used by deployment platforms
// to verify the server is running
app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Smart Student Management System API is running",
    environment: env.nodeEnv,
    timestamp: new Date().toISOString(),
  });
});

// Mount all API routes under /api prefix
// routes/index.js aggregates all sub-routers
app.use("/api", routes);

// ─────────────────────────────────────────────────────────────
// 404 HANDLER — Catch requests to undefined routes
// Must come AFTER all route definitions
// ─────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
});

// ─────────────────────────────────────────────────────────────
// GLOBAL ERROR HANDLER — Must be the LAST middleware
// Express identifies it by the 4-parameter signature (err, req, res, next)
// ─────────────────────────────────────────────────────────────
app.use(errorHandler);

module.exports = app;
