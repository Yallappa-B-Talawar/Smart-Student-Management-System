// ─────────────────────────────────────────────────────────────
// FILE: src/utils/ApiResponse.js
// PURPOSE: Standardize ALL successful API responses
// WHY: Without this, different controllers might return data in
//      different shapes. The frontend would need to handle 10
//      different response formats. With ApiResponse, EVERY
//      successful response looks identical — predictable for frontend.
//
// SHAPE: { success: true, message: "...", data: {...}, pagination: {...} }
// ─────────────────────────────────────────────────────────────

class ApiResponse {
  /**
   * @param {number} statusCode  - HTTP status (200, 201, 204...)
   * @param {string} message     - Human-readable success message
   * @param {*}      data        - The actual payload (object, array, null)
   * @param {object} pagination  - Optional pagination meta (for list endpoints)
   */
  constructor(statusCode, message, data = null, pagination = null) {
    this.success = statusCode >= 200 && statusCode < 300;
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;

    // Only include pagination if it was provided
    // We don't want "pagination: null" on non-list responses
    if (pagination) {
      this.pagination = pagination;
    }
  }
}

module.exports = ApiResponse;
