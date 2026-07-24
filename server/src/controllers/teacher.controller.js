const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const ApiError = require("../utils/ApiError");
const teacherService = require("../services/teacher.service");
const Teacher = require("../models/Teacher");

const create = asyncHandler(async (req, res) => {
  const orgService = require("../services/organization.service");

  if (!req.body.organizationId) {
    throw new ApiError(400, "Organization selection is required.");
  }
  if (!req.body.organizationCode) {
    throw new ApiError(400, "Organization code is required.");
  }
  const org = await orgService.verifyOrganization(req.body.organizationId, req.body.organizationCode);
  req.body.organization = org._id;

  const teacher = await teacherService.createTeacher(req.body);
  const response = new ApiResponse(201, "Teacher created successfully", teacher);
  res.status(response.statusCode).json(response);
});

const getAll = asyncHandler(async (req, res) => {
  const User = require("../models/User");
  let organizationId = req.user.organization;
  if (!organizationId) {
    const user = await User.findById(req.user.id);
    if (user) organizationId = user.organization;
  }
  
  // Preserve requested organization filter if provided; fallback to user's assigned organizationId
  if (!req.query.organization && organizationId) {
    req.query.organization = organizationId;
  }

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
  const orgService = require("../services/organization.service");

  if (req.user.role === "admin") {
    if (req.body.organizationId) {
      if (!req.body.organizationCode) {
        throw new ApiError(400, "Organization code is required when updating organization.");
      }
      const org = await orgService.verifyOrganization(req.body.organizationId, req.body.organizationCode);
      req.body.organization = org._id;
    }
  } else {
    delete req.body.organization;
    delete req.body.organizationId;
    delete req.body.organizationCode;
  }

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
  const User = require("../models/User");
  let organizationId = req.user.organization;
  if (!organizationId) {
    const user = await User.findById(req.user.id);
    if (user) organizationId = user.organization;
  }

  const stats = await teacherService.getTeacherStats(organizationId);
  const response = new ApiResponse(200, "Teacher stats", stats);
  res.status(response.statusCode).json(response);
});

/**
 * getMyProfile — Teacher fetches their own Teacher record
 * Matches logged-in user's email to their Teacher document
 */
const getMyProfile = asyncHandler(async (req, res) => {
  const teacher = await Teacher.findOne({ email: req.user.email }).populate("organization", "name");
  if (!teacher) {
    throw new ApiError(404, "Teacher profile not found. Please contact admin.");
  }
  const response = new ApiResponse(200, "Teacher profile fetched", teacher);
  res.status(response.statusCode).json(response);
});

/**
 * updateMyProfile — Teacher updates their own subject, classes, phone
 * Only allows updating specific fields (not status or name — admin controls those)
 */
const updateMyProfile = asyncHandler(async (req, res) => {
  const { subject, classes, phone, qualification, experience } = req.body;

  const teacher = await Teacher.findOne({ email: req.user.email });
  if (!teacher) {
    throw new ApiError(404, "Teacher profile not found.");
  }

  // Only update allowed fields
  if (subject !== undefined) teacher.subject = subject;
  if (phone !== undefined) teacher.phone = phone;
  if (qualification !== undefined) teacher.qualification = qualification;
  if (experience !== undefined) teacher.experience = experience;

  // classes must be an array of trimmed non-empty strings
  if (classes !== undefined) {
    teacher.classes = Array.isArray(classes)
      ? classes.map(c => c.trim()).filter(Boolean)
      : classes.split(",").map(c => c.trim()).filter(Boolean);
  }

  await teacher.save();
  const response = new ApiResponse(200, "Profile updated successfully", teacher);
  res.status(response.statusCode).json(response);
});

module.exports = { create, getAll, getById, update, remove, getStats, getMyProfile, updateMyProfile };

