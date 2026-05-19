const express = require("express");
const router = express.Router();
const teacherController = require("../controllers/teacher.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

// All routes require authentication
router.use(protect);

// Teacher self-profile — must be BEFORE /:id to avoid conflict
router.get("/my-profile", teacherController.getMyProfile);
router.put("/my-profile", teacherController.updateMyProfile);

// GET routes — accessible to all roles (admin, teacher, student)
router.get("/stats", teacherController.getStats);
router.get("/", teacherController.getAll);
router.get("/:id", teacherController.getById);

// POST/PUT/DELETE — admin only
router.post("/", authorize("admin"), teacherController.create);
router.put("/:id", authorize("admin"), teacherController.update);
router.delete("/:id", authorize("admin"), teacherController.remove);

module.exports = router;
