const express = require("express");
const router = express.Router();

const authRoutes = require("./auth.routes");
const studentRoutes = require("./student.routes");
const teacherRoutes = require("./teacher.routes");
const attendanceRoutes = require("./attendance.routes");
const organizationRoutes = require("./organization.routes");

router.use("/auth", authRoutes);
router.use("/students", studentRoutes);
router.use("/teachers", teacherRoutes);
router.use("/attendance", attendanceRoutes);
router.use("/organizations", organizationRoutes);

module.exports = router;

