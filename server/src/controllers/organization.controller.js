const asyncHandler = require("../utils/asyncHandler");
const ApiResponse = require("../utils/ApiResponse");
const orgService = require("../services/organization.service");

const jwt = require("jsonwebtoken");
const env = require("../config/env");

// Public — no auth required, used by registration page
const getAll = asyncHandler(async (req, res) => {
  let isAdmin = false;
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    try {
      const decoded = jwt.verify(token, env.jwt.accessSecret);
      if (decoded && decoded.role === "admin") {
        isAdmin = true;
      }
    } catch (err) {
      // Ignore verification errors for public access
    }
  }

  // If requester is admin, include inactive orgs and join codes
  const orgs = await orgService.getAllOrganizations(isAdmin, isAdmin);
  const response = new ApiResponse(200, "Organizations fetched", orgs);
  res.status(response.statusCode).json(response);
});

const getById = asyncHandler(async (req, res) => {
  const org = await orgService.getOrganizationById(req.params.id);
  const response = new ApiResponse(200, "Organization fetched", org);
  res.status(response.statusCode).json(response);
});

// Admin only
const create = asyncHandler(async (req, res) => {
  const org = await orgService.createOrganization(req.body, req.user.id);
  const response = new ApiResponse(201, "Organization created successfully", org);
  res.status(response.statusCode).json(response);
});

const update = asyncHandler(async (req, res) => {
  const org = await orgService.updateOrganization(req.params.id, req.body);
  const response = new ApiResponse(200, "Organization updated", org);
  res.status(response.statusCode).json(response);
});

const remove = asyncHandler(async (req, res) => {
  await orgService.deleteOrganization(req.params.id);
  const response = new ApiResponse(200, "Organization deleted");
  res.status(response.statusCode).json(response);
});

const getStats = asyncHandler(async (req, res) => {
  const stats = await orgService.getOrganizationStats();
  const response = new ApiResponse(200, "Organization stats", stats);
  res.status(response.statusCode).json(response);
});

module.exports = { getAll, getById, create, update, remove, getStats };
