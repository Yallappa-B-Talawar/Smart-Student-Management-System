const express = require("express");
const router = express.Router();
const attendanceController = require("../controllers/attendance.controller");
const { protect } = require("../middleware/auth.middleware");

router.use(protect);

router.post("/mark", attendanceController.mark);
router.get("/", attendanceController.getByClass);
router.get("/stats", attendanceController.getStats);

module.exports = router;
