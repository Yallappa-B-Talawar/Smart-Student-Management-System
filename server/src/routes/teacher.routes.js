const express = require("express");
const router = express.Router();
const teacherController = require("../controllers/teacher.controller");
const { protect } = require("../middleware/auth.middleware");

router.use(protect);

router.get("/stats", teacherController.getStats);
router.route("/").get(teacherController.getAll).post(teacherController.create);
router.route("/:id").get(teacherController.getById).put(teacherController.update).delete(teacherController.remove);

module.exports = router;
