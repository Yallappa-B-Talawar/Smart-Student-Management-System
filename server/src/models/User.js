// ─────────────────────────────────────────────────────────────
// FILE: src/models/User.js
// PURPOSE: Define the User schema and model for MongoDB
// WHY: Mongoose schemas enforce data structure at the application
//      level. MongoDB itself is schema-less, but Mongoose adds
//      validation, type casting, and hooks — making your data reliable.
//
// THINK OF SCHEMAS LIKE:
// A form with mandatory fields. If someone tries to save without
// required fields, Mongoose rejects it before hitting the database.
// ─────────────────────────────────────────────────────────────

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    // ── Identity ────────────────────────────────────────────
    name: {
      type: String,
      required: [true, "Name is required"],      // [value, errorMessage]
      trim: true,                                 // remove leading/trailing spaces
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,          // Creates a unique index in MongoDB (fast lookup + no duplicates)
      lowercase: true,       // Always store as lowercase — "Admin@Test.com" → "admin@test.com"
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        "Please provide a valid email address",
      ],
    },

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      // select: false means this field is EXCLUDED from query results by default
      // You must explicitly request it: User.findOne().select("+password")
      // This prevents accidentally sending passwords in API responses
      select: false,
    },

    // ── Role-Based Access Control ────────────────────────────
    role: {
      type: String,
      enum: {
        values: ["admin", "teacher", "student"],
        message: "Role must be admin, teacher, or student",
      },
      required: [true, "Role is required"],
    },

    // ── Profile ──────────────────────────────────────────────
    avatar: {
      type: String,
      default: "",
    },

    phone: {
      type: String,
      default: "",
    },

    // ── Organization ─────────────────────────────────────────
    // Links the user to their school/organization
    organization: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      default: null,
    },

    // ── Account Status ───────────────────────────────────────
    isActive: {
      type: Boolean,
      default: true,
    },

    // ── Security ─────────────────────────────────────────────
    refreshToken: {
      type: String,
      select: false,
    },

    lastLogin: {
      type: Date,
    },
  },
  { timestamps: true }
);

// ─────────────────────────────────────────────────────────────
// MONGOOSE MIDDLEWARE (Hooks)
// Pre-save hook: runs BEFORE saving to database
// Perfect for hashing passwords — happens automatically every time
// ─────────────────────────────────────────────────────────────

userSchema.pre("save", async function (next) {
  // Only hash password if it was changed (or is new)
  // WHY: If user updates their name, we don't re-hash the password
  // this.isModified("password") = true only if password field changed
  if (!this.isModified("password")) return next();

  // Hash the password with salt rounds = 12
  // Higher rounds = more secure but slower (12 is production standard)
  // bcrypt.hash is async — always use await
  this.password = await bcrypt.hash(this.password, 12);

  next(); // Continue saving
});

// ─────────────────────────────────────────────────────────────
// INSTANCE METHODS
// Methods added to every User document instance
// ─────────────────────────────────────────────────────────────

/**
 * comparePassword — Safely compare entered password with hashed password
 * WHY: We can't reverse a hash, so we hash the input and compare hashes
 *
 * @param {string} candidatePassword - The plain-text password user typed
 * @returns {boolean} - true if match, false if not
 */
userSchema.methods.comparePassword = async function (candidatePassword) {
  // bcrypt.compare handles the hashing and comparison
  // "this.password" is the stored hash from the database
  return await bcrypt.compare(candidatePassword, this.password);
};

// ─────────────────────────────────────────────────────────────
// INDEXES
// MongoDB can create indexes to speed up queries
// email already has a unique index (from unique: true above)
// ─────────────────────────────────────────────────────────────

// Compound index: queries like "find all teachers" will be fast
userSchema.index({ role: 1 });
userSchema.index({ isActive: 1 });

// Create and export the Model
// "User" → MongoDB will create a collection called "users" (pluralized, lowercase)
const User = mongoose.model("User", userSchema);

module.exports = User;
