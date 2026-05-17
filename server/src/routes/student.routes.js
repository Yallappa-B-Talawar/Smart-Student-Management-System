const express = require("express");
const router = express.Router();
const studentController = require("../controllers/student.controller");
const { protect, authorize } = require("../middleware/auth.middleware");

// All routes require authentication
router.use(protect);

// GET routes — accessible to all roles (admin, teacher, student)
router.get("/stats", studentController.getStats);
router.get("/", studentController.getAll);
router.get("/:id", studentController.getById);

// POST/PUT/DELETE — admin only
router.post("/", authorize("admin"), studentController.create);
router.put("/:id", authorize("admin"), studentController.update);
router.delete("/:id", authorize("admin"), studentController.remove);

module.exports = router;
