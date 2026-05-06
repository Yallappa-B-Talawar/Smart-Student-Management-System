// ─────────────────────────────────────────────────────────────
// FILE: src/middleware/rbac.middleware.js
// PURPOSE: Role-Based Access Control — restricts routes by role
//
// HOW IT WORKS:
// After auth.middleware.js sets req.user.role, this middleware
// checks if that role is in the allowed list. If not → 403 Forbidden.
//
// REAL-WORLD ANALOGY:
// Auth middleware = checking your ID at the building door (are you an employee?)
// RBAC middleware = checking your badge level at a restricted floor
//   (are you a manager allowed on the executive floor?)
//
// USAGE:
//   router.delete("/students/:id", protect, authorize("admin"), deleteStudent);
//   router.post("/attendance", protect, authorize("admin", "teacher"), markAttendance);
// ─────────────────────────────────────────────────────────────

const ApiError = require("../utils/ApiError");

/**
 * authorize — Middleware factory that restricts by role
 *
 * @param  {...string} allowedRoles - Roles permitted (e.g., "admin", "teacher")
 * @returns {Function} Express middleware
 *
 * Uses the REST SPREAD operator (...) so you can pass any number of roles:
 *   authorize("admin")                → only admin
 *   authorize("admin", "teacher")     → admin OR teacher
 */
const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // req.user is set by the protect middleware (auth.middleware.js)
    // If protect didn't run first, req.user will be undefined
    if (!req.user) {
      throw new ApiError(401, "Authentication required");
    }

    // Check if the user's role is in the allowed list
    if (!allowedRoles.includes(req.user.role)) {
      throw new ApiError(
        403,
        `Access denied. Role '${req.user.role}' is not authorized for this action.`
      );
    }

    // User has the right role — proceed
    next();
  };
};

module.exports = { authorize };
