const express = require("express");
const router = express.Router();
const studentController = require("../controllers/student.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

// All routes require authentication
router.use(protect);

// Student self-profile — must be BEFORE /:id to avoid conflict
router.get("/my-profile", studentController.getMyProfile);

// GET routes — admin and teacher can view
router.get("/stats", authorize("admin", "teacher"), studentController.getStats);
router.get("/", authorize("admin", "teacher"), studentController.getAll);
router.get("/:id", authorize("admin", "teacher"), studentController.getById);

// POST/PUT — admin and teacher can create/edit
router.post("/", authorize("admin", "teacher"), studentController.create);
router.put("/:id", authorize("admin", "teacher"), studentController.update);

// DELETE — admin only
router.delete("/:id", authorize("admin"), studentController.remove);

module.exports = router;
