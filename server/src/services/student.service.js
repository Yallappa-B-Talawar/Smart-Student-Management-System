const Student = require("../models/Student");
const ApiError = require("../utils/ApiError");

const createStudent = async (data) => {
  const existing = await Student.findOne({ $or: [{ email: data.email }, { rollNo: data.rollNo }] });
  if (existing) throw new ApiError(409, "Student with this email or roll number already exists");
  return await Student.create(data);
};

const getAllStudents = async (query = {}) => {
  const { page = 1, limit = 50, search, class: cls, status, classes, period } = query;
  const filter = {};

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
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(Number(limit));

  const total = await Student.countDocuments(filter);
  return { students, total, page: Number(page), totalPages: Math.ceil(total / limit) };
};

const getStudentById = async (id) => {
  const student = await Student.findById(id);
  if (!student) throw new ApiError(404, "Student not found");
  return student;
};

const updateStudent = async (id, data) => {
  const student = await Student.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!student) throw new ApiError(404, "Student not found");
  return student;
};

const deleteStudent = async (id) => {
  const student = await Student.findByIdAndDelete(id);
  if (!student) throw new ApiError(404, "Student not found");
  return student;
};

const getStudentStats = async (classFilter = null) => {
  const baseFilter = classFilter ? { class: { $in: classFilter } } : {};
  const total = await Student.countDocuments(baseFilter);
  const active = await Student.countDocuments({ ...baseFilter, status: "active" });
  const inactive = await Student.countDocuments({ ...baseFilter, status: "inactive" });
  const classes = classFilter
    ? classFilter
    : await Student.distinct("class");
  return { total, active, inactive, classCount: classes.length, classes };
};

module.exports = { createStudent, getAllStudents, getStudentById, updateStudent, deleteStudent, getStudentStats };
