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
const authRoutes = require("./auth.routes");
const studentRoutes = require("./student.routes");
const teacherRoutes = require("./teacher.routes");
const attendanceRoutes = require("./attendance.routes");

// ── Mount routes with their URL prefix ─────────────────────
router.use("/auth", authRoutes);
router.use("/students", studentRoutes);
router.use("/teachers", teacherRoutes);
router.use("/attendance", attendanceRoutes);

module.exports = router;
