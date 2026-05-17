const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const attendanceService = require("../services/attendance.service");
const Student = require("../models/Student");

const mark = asyncHandler(async (req, res) => {
  const { records } = req.body;
  const result = await attendanceService.markAttendance(records, req.user.id);
  const response = new ApiResponse(200, "Attendance saved", result);
  res.status(response.statusCode).json(response);
});

const getByClass = asyncHandler(async (req, res) => {
  const { class: cls, date } = req.query;
  const result = await attendanceService.getAttendanceByClass(cls, date || new Date());
  const response = new ApiResponse(200, "Attendance fetched", result);
  res.status(response.statusCode).json(response);
});

const getStats = asyncHandler(async (req, res) => {
  const { class: cls, date } = req.query;
  const stats = await attendanceService.getAttendanceStats(cls, date || new Date());
  const response = new ApiResponse(200, "Attendance stats", stats);
  res.status(response.statusCode).json(response);
});

/**
 * getMyAttendance — For students to see ONLY their own attendance history
 * Matches logged-in user's email → Student record → Attendance records
 */
const getMyAttendance = asyncHandler(async (req, res) => {
  const student = await Student.findOne({ email: req.user.email });
  if (!student) {
    const response = new ApiResponse(200, "No attendance records", { records: [], stats: { present: 0, absent: 0, late: 0, total: 0, rate: 0 } });
    return res.status(response.statusCode).json(response);
  }

  const { month, year } = req.query;
  const result = await attendanceService.getStudentAttendance(student._id, month, year);
  const response = new ApiResponse(200, "My attendance fetched", result);
  res.status(response.statusCode).json(response);
});

module.exports = { mark, getByClass, getStats, getMyAttendance };
