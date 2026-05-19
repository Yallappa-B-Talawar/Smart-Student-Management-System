const express = require("express");
const router = express.Router();
const orgController = require("../controllers/organization.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

// PUBLIC — no auth needed (for registration dropdown)
router.get("/", orgController.getAll);
router.get("/:id", orgController.getById);

// PROTECTED — admin only
router.use(protect);
router.get("/admin/stats", authorize("admin"), orgController.getStats);
router.post("/", authorize("admin"), orgController.create);
router.put("/:id", authorize("admin"), orgController.update);
router.delete("/:id", authorize("admin"), orgController.remove);

module.exports = router;
