// routes/ssg.js
const express = require("express");
const router = express.Router();
const ssg = require("../controllers/ssgController");
const { authRequired, requireAnyRole, requireRole } = require("../middleware/authMiddleware");

router.post("/election", authRequired, requireAnyRole(["SSG", "Registrar", "SuperAdmin"]), ssg.createElection);
router.post("/nominate", authRequired, requireAnyRole(["Student", "Registrar", "SuperAdmin"]), ssg.nominateCandidate);
router.post("/vote", authRequired, requireRole("Student"), ssg.castVote);
router.post("/event", authRequired, requireAnyRole(["SSG", "Registrar", "SuperAdmin"]), ssg.createSSGEvent);

module.exports = router;
