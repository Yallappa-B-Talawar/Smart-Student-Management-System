const Teacher = require("../models/Teacher");
const ApiError = require("../utils/ApiError");

const createTeacher = async (data) => {
  const existing = await Teacher.findOne({ email: data.email });
  if (existing) throw new ApiError(409, "Teacher with this email already exists");
  return await Teacher.create(data);
};

const getAllTeachers = async (query = {}) => {
  const { page = 1, limit = 50, search, status } = query;
  const filter = {};
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
      { subject: { $regex: search, $options: "i" } },
    ];
  }
  if (status) filter.status = status;

  const teachers = await Teacher.find(filter)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Teacher.countDocuments(filter);
  return { teachers, total, page: Number(page), totalPages: Math.ceil(total / limit) };
};

const getTeacherById = async (id) => {
  const teacher = await Teacher.findById(id);
  if (!teacher) throw new ApiError(404, "Teacher not found");
  return teacher;
};

const updateTeacher = async (id, data) => {
  const teacher = await Teacher.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!teacher) throw new ApiError(404, "Teacher not found");
  return teacher;
};

const deleteTeacher = async (id) => {
  const teacher = await Teacher.findByIdAndDelete(id);
  if (!teacher) throw new ApiError(404, "Teacher not found");
  return teacher;
};

const getTeacherStats = async () => {
  const total = await Teacher.countDocuments();
  const active = await Teacher.countDocuments({ status: "active" });
  const onLeave = await Teacher.countDocuments({ status: "on-leave" });
  return { total, active, onLeave };
};

module.exports = { createTeacher, getAllTeachers, getTeacherById, updateTeacher, deleteTeacher, getTeacherStats };
