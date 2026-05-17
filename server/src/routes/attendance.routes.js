const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendance.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

// All routes require authentication
router.use(protect);

// GET routes — accessible to all roles
router.get("/", attendanceController.getByClass);
router.get("/stats", attendanceController.getStats);

// POST (mark attendance) — admin and teacher only
router.post("/mark", authorize("admin", "teacher"), attendanceController.mark);

module.exports = router;
