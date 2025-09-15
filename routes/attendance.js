// routes/attendance.js
const express = require("express");
const router = express.Router();
const academics = require("../controllers/academicsController");
const { authRequired, requireAnyRole } = require("../middleware/authMiddleware");

router.post("/", authRequired, requireAnyRole(["Admin", "Registrar", "Moderator"]), academics.markAttendance);

module.exports = router;
