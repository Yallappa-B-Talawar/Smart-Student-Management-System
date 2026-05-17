const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const studentService = require("../services/student.service");
const Teacher = require("../models/Teacher");

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
    const teacher = await Teacher.findOne({ user: req.user.id });
    if (!teacher) {
      // Fallback: check by email
      const teacherByEmail = await Teacher.findOne({ email: req.user.email });
      if (teacherByEmail && teacherByEmail.classes.length > 0) {
        req.query.classes = teacherByEmail.classes;
      }
    } else if (teacher.classes.length > 0) {
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
  // If teacher, get stats only for their classes
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

module.exports = { create, getAll, getById, update, remove, getStats };
