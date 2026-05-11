const Attendance = require("../models/Attendance");
const Student = require("../models/Student");
const ApiError = require("../utils/ApiError");

const markAttendance = async (records, markedBy) => {
  const results = [];
  for (const record of records) {
    const result = await Attendance.findOneAndUpdate(
      { student: record.student, date: record.date },
      { status: record.status, class: record.class, markedBy },
      { upsert: true, new: true, runValidators: true }
    );
    results.push(result);
  }
  return results;
};

const getAttendanceByClass = async (cls, date) => {
  const students = await Student.find({ class: cls, status: "active" }).sort({ rollNo: 1 });
  const dateObj = new Date(date);
  dateObj.setHours(0, 0, 0, 0);
  const endDate = new Date(dateObj);
  endDate.setHours(23, 59, 59, 999);

  const attendance = await Attendance.find({
    class: cls,
    date: { $gte: dateObj, $lte: endDate },
  });

  const attendanceMap = {};
  attendance.forEach((a) => {
    attendanceMap[a.student.toString()] = a.status;
  });

  return students.map((s) => ({
    _id: s._id,
    rollNo: s.rollNo,
    name: s.name,
    status: attendanceMap[s._id.toString()] || "unmarked",
  }));
};

const getAttendanceStats = async (cls, date) => {
  const dateObj = new Date(date);
  dateObj.setHours(0, 0, 0, 0);
  const endDate = new Date(dateObj);
  endDate.setHours(23, 59, 59, 999);

  const filter = { date: { $gte: dateObj, $lte: endDate } };
  if (cls) filter.class = cls;

  const present = await Attendance.countDocuments({ ...filter, status: "present" });
  const absent = await Attendance.countDocuments({ ...filter, status: "absent" });
  const late = await Attendance.countDocuments({ ...filter, status: "late" });
  const totalStudents = cls
    ? await Student.countDocuments({ class: cls, status: "active" })
    : await Student.countDocuments({ status: "active" });

  return { present, absent, late, totalStudents, rate: totalStudents > 0 ? Math.round((present / totalStudents) * 100) : 0 };
};

module.exports = { markAttendance, getAttendanceByClass, getAttendanceStats };
