const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const studentService = require("../services/student.service");

const create = asyncHandler(async (req, res) => {
  const student = await studentService.createStudent(req.body);
  const response = new ApiResponse(201, "Student created successfully", student);
  res.status(response.statusCode).json(response);
});

const getAll = asyncHandler(async (req, res) => {
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
  const stats = await studentService.getStudentStats();
  const response = new ApiResponse(200, "Student stats", stats);
  res.status(response.statusCode).json(response);
});

module.exports = { create, getAll, getById, update, remove, getStats };
