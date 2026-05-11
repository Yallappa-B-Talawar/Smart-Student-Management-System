const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const attendanceService = require("../services/attendance.service");

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

module.exports = { mark, getByClass, getStats };
