// ─────────────────────────────────────────────────────────────
// FILE: src/routes/index.js
// PURPOSE: Master router — aggregates all sub-routers
// WHY: Instead of importing 8 route files into app.js, we
//      import just this ONE file. app.js stays clean.
//      Adding a new resource = add one line here.
// ─────────────────────────────────────────────────────────────

const express = require("express");
const router = express.Router();

// ── Import all route modules ───────────────────────────────
// Each file handles one resource (auth, students, teachers...)
const authRoutes = require("./auth.routes");

// ── Mount routes with their URL prefix ─────────────────────
// All auth endpoints will be at: /api/auth/...
router.use("/auth", authRoutes);

// TODO: Add these as we build each module:
// router.use("/students", studentRoutes);
// router.use("/teachers", teacherRoutes);
// router.use("/attendance", attendanceRoutes);
// router.use("/marks", markRoutes);
// router.use("/assignments", assignmentRoutes);
// router.use("/notifications", notificationRoutes);
// router.use("/dashboard", dashboardRoutes);

module.exports = router;
