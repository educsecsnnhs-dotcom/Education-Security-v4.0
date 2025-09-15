// routes/student.js
const express = require("express");
const router = express.Router();
const academics = require("../controllers/academicsController");
const { authRequired, requireRole } = require("../middleware/authMiddleware");

router.get("/grades", authRequired, requireRole("Student"), academics.getMyGrades);

module.exports = router;
