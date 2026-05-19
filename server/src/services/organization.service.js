const Organization = require("../models/Organization");
const ApiError = require("../utils/ApiError");

const createOrganization = async (data, createdBy) => {
  // Ensure code is exactly 5 uppercase alphanumeric chars
  const code = data.code?.toString().trim().toUpperCase();
  if (!code || !/^[A-Z0-9]{5}$/.test(code)) {
    throw new ApiError(400, "Code must be exactly 5 uppercase letters or digits (e.g. SCHOL, AB12C)");
  }

  const existing = await Organization.findOne({
    $or: [{ name: data.name }, { code }],
  });
  if (existing) {
    if (existing.name === data.name) throw new ApiError(409, "An organization with this name already exists");
    throw new ApiError(409, "An organization with this code already exists. Choose a different 5-letter code.");
  }

  return await Organization.create({ ...data, code, createdBy });
};

// Public — anyone can fetch active orgs (for registration dropdown)
const getAllOrganizations = async (includeInactive = false) => {
  const filter = includeInactive ? {} : { status: "active" };
  return await Organization.find(filter).sort({ name: 1 }).select("_id name description address status createdAt");
};

const getOrganizationById = async (id) => {
  const org = await Organization.findById(id);
  if (!org) throw new ApiError(404, "Organization not found");
  return org;
};

// Verify org name + code match — used during registration
const verifyOrganization = async (organizationId, code) => {
  const org = await Organization.findById(organizationId);
  if (!org) throw new ApiError(404, "Organization not found");
  if (org.status !== "active") throw new ApiError(403, "This organization is currently inactive");
  if (org.code !== code.trim().toUpperCase()) {
    throw new ApiError(400, "Invalid organization code. Please check the code provided by your admin.");
  }
  return org;
};

const updateOrganization = async (id, data) => {
  // Don't allow code changes via update (immutable once set)
  delete data.code;
  const org = await Organization.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!org) throw new ApiError(404, "Organization not found");
  return org;
};

const deleteOrganization = async (id) => {
  const org = await Organization.findByIdAndDelete(id);
  if (!org) throw new ApiError(404, "Organization not found");
  return org;
};

const getOrganizationStats = async () => {
  const total = await Organization.countDocuments();
  const active = await Organization.countDocuments({ status: "active" });
  const inactive = await Organization.countDocuments({ status: "inactive" });
  return { total, active, inactive };
};

module.exports = {
  createOrganization,
  getAllOrganizations,
  getOrganizationById,
  verifyOrganization,
  updateOrganization,
  deleteOrganization,
  getOrganizationStats,
};
