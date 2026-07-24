const express = require("express");
const router = express.Router();
const orgController = require("../controllers/organization.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

// PUBLIC — no auth needed (for registration dropdown)
router.get("/", orgController.getAll);

// PROTECTED — admin only (defined before /:id to prevent routing conflict)
router.get("/admin/stats", protect, authorize("admin"), orgController.getStats);

// PUBLIC — get org by id
router.get("/:id", orgController.getById);

// PROTECTED — admin only for write operations
router.use(protect);
router.post("/", authorize("admin"), orgController.create);
router.put("/:id", authorize("admin"), orgController.update);
router.delete("/:id", authorize("admin"), orgController.remove);

module.exports = router;
