const Student = require("../models/Student");
const ApiError = require("../utils/ApiError");

const createStudent = async (data) => {
  const existing = await Student.findOne({ $or: [{ email: data.email }, { rollNo: data.rollNo }] });
  if (existing) throw new ApiError(409, "Student with this email or roll number already exists");
  return await Student.create(data);
};

const getAllStudents = async (query = {}) => {
  const { page = 1, limit = 50, search, class: cls, status, classes, period, organization } = query;
  const filter = {};

  if (organization) {
    const mongoose = require("mongoose");
    if (mongoose.Types.ObjectId.isValid(organization)) {
      filter.organization = new mongoose.Types.ObjectId(organization);
    } else {
      filter.organization = organization;
    }
  }

  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { rollNo: { $regex: search, $options: "i" } },
      { email: { $regex: search, $options: "i" } },
    ];
  }
  // Class filter
  if (cls) filter.class = cls;
  // Teacher's classes restriction
  if (classes && classes.length > 0 && !cls) {
    filter.class = { $in: classes };
  }
  if (status) filter.status = status;

  // Period filter — today / week / month
  if (period && period !== 'all') {
    const now = new Date();
    let from;
    if (period === 'today') {
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    } else if (period === 'week') {
      // Start of current week (Monday)
      const day = now.getDay(); // 0=Sun,1=Mon,...
      const diffToMonday = (day === 0 ? -6 : 1 - day);
      from = new Date(now);
      from.setDate(now.getDate() + diffToMonday);
      from.setHours(0, 0, 0, 0);
    } else if (period === 'month') {
      from = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    }
    if (from) filter.createdAt = { $gte: from };
  }

  const students = await Student.find(filter)
    .populate("organization", "name")
    .populate("user", "name email role isActive lastLogin")
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const User = require("../models/User");
  for (let i = 0; i < students.length; i++) {
    const s = students[i];
    if (!s.user || s.user.email !== s.email) {
      const u = await User.findOne({ email: s.email });
      if (u && (!s.user || s.user._id.toString() !== u._id.toString())) {
        s.user = u._id;
        await s.save();
        students[i] = await Student.findById(s._id)
          .populate("organization", "name")
          .populate("user", "name email role isActive lastLogin");
      }
    }
  }

  const total = await Student.countDocuments(filter);
  return { students, total, page: Number(page), totalPages: Math.ceil(total / limit) };
};

const getStudentById = async (id) => {
  let student = await Student.findById(id)
    .populate("organization", "name")
    .populate("user", "name email role isActive lastLogin");
  if (!student) throw new ApiError(404, "Student not found");

  if (!student.user || student.user.email !== student.email) {
    const User = require("../models/User");
    const u = await User.findOne({ email: student.email });
    if (u && (!student.user || student.user._id.toString() !== u._id.toString())) {
      student.user = u._id;
      await student.save();
      student = await Student.findById(id)
        .populate("organization", "name")
        .populate("user", "name email role isActive lastLogin");
    }
  }
  return student;
};

const updateStudent = async (id, data) => {
  const student = await Student.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    .populate("organization", "name")
    .populate("user", "name email role isActive lastLogin");
  if (!student) throw new ApiError(404, "Student not found");

  if (data.organization && student.user) {
    const User = require("../models/User");
    await User.findByIdAndUpdate(student.user, { organization: data.organization });
  }

  return student;
};

const deleteStudent = async (id) => {
  const student = await Student.findByIdAndDelete(id);
  if (!student) throw new ApiError(404, "Student not found");
  return student;
};

const getStudentStats = async (classFilter = null, organizationId = null) => {
  const baseFilter = {};
  if (classFilter && classFilter.length > 0) {
    baseFilter.class = { $in: classFilter };
  }
  if (organizationId) {
    baseFilter.organization = organizationId;
  }
  
  const total = await Student.countDocuments(baseFilter);
  const active = await Student.countDocuments({ ...baseFilter, status: "active" });
  const inactive = await Student.countDocuments({ ...baseFilter, status: "inactive" });
  const classes = classFilter
    ? classFilter
    : await Student.distinct("class", baseFilter);
  return { total, active, inactive, classCount: classes.length, classes };
};

module.exports = { createStudent, getAllStudents, getStudentById, updateStudent, deleteStudent, getStudentStats };
