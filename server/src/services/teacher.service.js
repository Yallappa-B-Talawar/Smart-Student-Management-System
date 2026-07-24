const Teacher = require("../models/Teacher");
const ApiError = require("../utils/ApiError");

const createTeacher = async (data) => {
  const existing = await Teacher.findOne({ email: data.email });
  if (existing) throw new ApiError(409, "Teacher with this email already exists");
  return await Teacher.create(data);
};

const getAllTeachers = async (query = {}) => {
  const { page = 1, limit = 50, search, status, organization } = query;
  const filter = {};
  
  if (organization) {
    const mongoose = require("mongoose");
    const Organization = require("../models/Organization");
    if (mongoose.Types.ObjectId.isValid(organization)) {
      filter.organization = new mongoose.Types.ObjectId(organization);
    } else {
      const escapedName = String(organization).replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
      const orgDoc = await Organization.findOne({ name: { $regex: new RegExp(`^${escapedName}$`, 'i') } });
      if (orgDoc) {
        filter.organization = orgDoc._id;
      } else {
        const matchingOrgs = await Organization.find({ name: { $regex: organization, $options: "i" } }).select('_id');
        filter.organization = { $in: matchingOrgs.map(o => o._id) };
      }
    }
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { subject: { $regex: search, $options: "i" } },
    ];
  }
  if (status) filter.status = status;

  const teachers = await Teacher.find(filter)
    .populate('organization', 'name')
    .populate('user', 'name email role isActive lastLogin')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Teacher.countDocuments(filter);
  return { teachers, total, page: Number(page), totalPages: Math.ceil(total / limit) };
};

const getTeacherById = async (id) => {
  const teacher = await Teacher.findById(id)
    .populate('organization', 'name')
    .populate('user', 'name email role isActive lastLogin');
  if (!teacher) throw new ApiError(404, 'Teacher not found');
  return teacher;
};

const updateTeacher = async (id, data) => {
  const teacher = await Teacher.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    .populate("organization", "name")
    .populate("user", "name email role isActive lastLogin");
  if (!teacher) throw new ApiError(404, "Teacher not found");

  if (data.organization && teacher.user) {
    const User = require("../models/User");
    await User.findByIdAndUpdate(teacher.user, { organization: data.organization });
  }

  return teacher;
};

const deleteTeacher = async (id) => {
  const teacher = await Teacher.findByIdAndDelete(id);
  if (!teacher) throw new ApiError(404, "Teacher not found");
  return teacher;
};

const getTeacherStats = async (organizationId = null) => {
  const filter = {};
  if (organizationId) {
    filter.organization = organizationId;
  }
  const total = await Teacher.countDocuments(filter);
  const active = await Teacher.countDocuments({ ...filter, status: "active" });
  const onLeave = await Teacher.countDocuments({ ...filter, status: "on-leave" });
  return { total, active, onLeave };
};

module.exports = { createTeacher, getAllTeachers, getTeacherById, updateTeacher, deleteTeacher, getTeacherStats };
