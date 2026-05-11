const express = require("express");
const router = express.Router();
const studentController = require("../controllers/student.controller");
const { protect } = require("../middleware/auth.middleware");

router.use(protect);

router.get("/stats", studentController.getStats);
router.route("/").get(studentController.getAll).post(studentController.create);
router.route("/:id").get(studentController.getById).put(studentController.update).delete(studentController.remove);

module.exports = router;
