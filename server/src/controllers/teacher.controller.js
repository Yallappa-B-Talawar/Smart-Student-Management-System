const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const teacherService = require("../services/teacher.service");

const create = asyncHandler(async (req, res) => {
  const teacher = await teacherService.createTeacher(req.body);
  const response = new ApiResponse(201, "Teacher created successfully", teacher);
  res.status(response.statusCode).json(response);
});

const getAll = asyncHandler(async (req, res) => {
  const result = await teacherService.getAllTeachers(req.query);
  const response = new ApiResponse(200, "Teachers fetched", result);
  res.status(response.statusCode).json(response);
});

const getById = asyncHandler(async (req, res) => {
  const teacher = await teacherService.getTeacherById(req.params.id);
  const response = new ApiResponse(200, "Teacher fetched", teacher);
  res.status(response.statusCode).json(response);
});

const update = asyncHandler(async (req, res) => {
  const teacher = await teacherService.updateTeacher(req.params.id, req.body);
  const response = new ApiResponse(200, "Teacher updated", teacher);
  res.status(response.statusCode).json(response);
});

const remove = asyncHandler(async (req, res) => {
  await teacherService.deleteTeacher(req.params.id);
  const response = new ApiResponse(200, "Teacher deleted");
  res.status(response.statusCode).json(response);
});

const getStats = asyncHandler(async (req, res) => {
  const stats = await teacherService.getTeacherStats();
  const response = new ApiResponse(200, "Teacher stats", stats);
  res.status(response.statusCode).json(response);
});

module.exports = { create, getAll, getById, update, remove, getStats };
