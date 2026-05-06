// ─────────────────────────────────────────────────────────────
// FILE: src/utils/asyncHandler.js
// PURPOSE: Eliminate repetitive try-catch blocks in every controller
// WHY: Every async controller function needs try-catch to handle
//      errors. Without this utility, you'd write:
//
//      const getStudents = async (req, res, next) => {
//        try {
//          // ... logic
//        } catch(err) {
//          next(err); // pass to error handler
//        }
//      };
//
//      With asyncHandler you write:
//      const getStudents = asyncHandler(async (req, res, next) => {
//        // ... logic — no try-catch needed!
//      });
//
// HOW IT WORKS (Higher-Order Function):
// asyncHandler is a function that TAKES a function and RETURNS
// a new function. The returned function wraps the original in
// a Promise chain — if it rejects (throws), it calls next(error)
// which forwards to Express's global error handler.
// ─────────────────────────────────────────────────────────────

/**
 * asyncHandler — Wraps an async route handler to auto-catch errors
 *
 * @param {Function} fn - The async controller function to wrap
 * @returns {Function}  - A new function that handles errors automatically
 *
 * REAL-WORLD ANALOGY:
 * Imagine a safety net under a tightrope walker. The walker (your
 * controller) focuses on the performance. If they fall (throw error),
 * the net (asyncHandler) catches them and calls the rescue team (next).
 */
const asyncHandler = (fn) => {
  // Return a standard Express middleware function (req, res, next)
  return (req, res, next) => {
    // Execute fn(req, res, next) as a Promise
    // If it resolves: response is sent normally
    // If it rejects: .catch(next) passes error to error middleware
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = asyncHandler;
