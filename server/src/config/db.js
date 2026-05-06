// ─────────────────────────────────────────────────────────────
// FILE: src/config/db.js
// PURPOSE: Establish and manage the MongoDB connection
// WHY: Database connection logic is isolated here so:
//      1. It can be tested independently
//      2. Connection errors are handled in one place
//      3. We can add reconnect logic without touching app.js
// ─────────────────────────────────────────────────────────────

const mongoose = require("mongoose");
const env = require("./env");

/**
 * connectDB — Connects to MongoDB using Mongoose
 *
 * HOW IT WORKS:
 * Mongoose is a library that sits between your Node.js app
 * and MongoDB. Instead of writing raw MongoDB queries, you
 * define "schemas" and use Mongoose's clean API.
 *
 * mongoose.connect(uri) returns a Promise, so we use async/await.
 * If the connection fails, we log the error and exit the process
 * with code 1 (non-zero = failure). This prevents the app from
 * running without a database — which would cause confusing errors.
 */
const connectDB = async () => {
  try {
    // mongoose.connect() returns a connection object
    const conn = await mongoose.connect(env.mongoUri);

    // conn.connection.host tells us WHICH server we connected to
    // Useful for verifying you're connected to the right cluster
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    // Log the specific error message (e.g., wrong password, wrong URI)
    console.error(`❌ MongoDB Connection Error: ${error.message}`);

    // process.exit(1) = "stop the Node.js process with error"
    // We exit because there's no point running the server
    // if it can't talk to the database
    process.exit(1);
  }
};

module.exports = connectDB;
