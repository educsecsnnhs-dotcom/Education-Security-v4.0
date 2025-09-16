// routes/recordbook.js
const express = require("express");
const router = express.Router();
const academics = require("../controllers/academicsController");
const { authRequired, requireAnyRole } = require("../middleware/authMiddleware");

// Admin or Registrar (or Moderator depending on your policy) should be allowed.
router.post("/", authRequired, requireAnyRole(["Admin", "Registrar", "Moderator"]), academics.createRecordBook);

module.exports = router;
