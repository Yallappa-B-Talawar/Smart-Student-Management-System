// ─────────────────────────────────────────────────────────────
// FILE: server.js (root of server/)
// PURPOSE: Entry point — connects to DB and starts the server
//
// WHY SEPARATE FROM app.js?
// app.js = Express configuration (importable for testing)
// server.js = Actually STARTS listening on a port
//
// In tests, you import app.js and use supertest — no real server needed.
// In production, server.js connects to the database, then starts listening.
// ─────────────────────────────────────────────────────────────

const app = require("./src/app");
const connectDB = require("./src/config/db");
const env = require("./src/config/env");

/**
 * startServer — Connects to MongoDB, then starts Express
 *
 * WHY ASYNC?
 * We must connect to MongoDB BEFORE accepting requests.
 * If DB is down, we don't start the server (fail fast).
 */
const startServer = async () => {
  try {
    // Step 1: Connect to MongoDB
    await connectDB();

    // Step 2: Start listening for HTTP requests
    app.listen(env.port, () => {
      console.log(`\n🚀 Server running in ${env.nodeEnv} mode on port ${env.port}`);
      console.log(`📡 API URL: http://localhost:${env.port}/api`);
      console.log(`❤️  Health:  http://localhost:${env.port}/api/health\n`);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error.message);
    process.exit(1);
  }
};

// Handle unhandled promise rejections globally
// Example: database connection drops after startup
process.on("unhandledRejection", (err) => {
  console.error("UNHANDLED REJECTION:", err.message);
  process.exit(1);
});

// Handle uncaught exceptions globally
// Example: accessing a property on undefined
process.on("uncaughtException", (err) => {
  console.error("UNCAUGHT EXCEPTION:", err.message);
  process.exit(1);
});

// Start the server
startServer();
