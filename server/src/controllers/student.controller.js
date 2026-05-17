const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const studentService = require("../services/student.service");
const Student = require("../models/Student");
const Teacher = require("../models/Teacher");
const User = require("../models/User");

const create = asyncHandler(async (req, res) => {
  // Auto-set who added this student
  req.body.addedBy = req.user.id;
  const student = await studentService.createStudent(req.body);
  const response = new ApiResponse(201, "Student created successfully", student);
  res.status(response.statusCode).json(response);
});

const getAll = asyncHandler(async (req, res) => {
  // If teacher, filter by their assigned classes
  if (req.user.role === "teacher") {
    const teacher = await Teacher.findOne({ user: req.user.id }) || await Teacher.findOne({ email: req.user.email });
    if (teacher && teacher.classes.length > 0) {
      req.query.classes = teacher.classes;
    }
  }
  const result = await studentService.getAllStudents(req.query);
  const response = new ApiResponse(200, "Students fetched", result);
  res.status(response.statusCode).json(response);
});

const getById = asyncHandler(async (req, res) => {
  const student = await studentService.getStudentById(req.params.id);
  const response = new ApiResponse(200, "Student fetched", student);
  res.status(response.statusCode).json(response);
});

const update = asyncHandler(async (req, res) => {
  const student = await studentService.updateStudent(req.params.id, req.body);
  const response = new ApiResponse(200, "Student updated", student);
  res.status(response.statusCode).json(response);
});

const remove = asyncHandler(async (req, res) => {
  await studentService.deleteStudent(req.params.id);
  const response = new ApiResponse(200, "Student deleted");
  res.status(response.statusCode).json(response);
});

const getStats = asyncHandler(async (req, res) => {
  let classFilter = null;
  if (req.user.role === "teacher") {
    const teacher = await Teacher.findOne({ user: req.user.id }) || await Teacher.findOne({ email: req.user.email });
    if (teacher && teacher.classes.length > 0) {
      classFilter = teacher.classes;
    }
  }
  const stats = await studentService.getStudentStats(classFilter);
  const response = new ApiResponse(200, "Student stats", stats);
  res.status(response.statusCode).json(response);
});

/**
 * getMyProfile — For students to see their own record
 * Matches the logged-in user's email with a Student record.
 * Also fetches the teacher who added them (addedBy field).
 */
const getMyProfile = asyncHandler(async (req, res) => {
  // Find student record by matching email
  const student = await Student.findOne({ email: req.user.email });
  if (!student) {
    const response = new ApiResponse(200, "No student profile linked yet", { student: null, teacher: null });
    return res.status(response.statusCode).json(response);
  }

  // Find the teacher who added this student
  let teacherInfo = null;
  if (student.addedBy) {
    // Get the user who added them
    const addedByUser = await User.findById(student.addedBy).select("name email role");
    if (addedByUser && addedByUser.role === "teacher") {
      // Get full teacher record
      const teacherRecord = await Teacher.findOne({ email: addedByUser.email });
      teacherInfo = {
        name: addedByUser.name,
        email: addedByUser.email,
        subject: teacherRecord?.subject || "N/A",
        phone: teacherRecord?.phone || "N/A",
      };
    } else if (addedByUser && addedByUser.role === "admin") {
      teacherInfo = { name: addedByUser.name, email: addedByUser.email, subject: "Admin", phone: "N/A" };
    }
  }

  const response = new ApiResponse(200, "Student profile fetched", {
    student,
    teacher: teacherInfo,
  });
  res.status(response.statusCode).json(response);
});

module.exports = { create, getAll, getById, update, remove, getStats, getMyProfile };
