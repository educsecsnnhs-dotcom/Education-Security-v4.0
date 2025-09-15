// routes/compat.js
// Compatibility wrappers for frontend endpoint names that don't exist in the original route layout.
const express = require("express");
const router = express.Router();
const multer = require("multer");
const path = require("path");
const { authRequired, requireAnyRole } = require("../middleware/authMiddleware");

const academics = require("../controllers/academicsController");
const Enrollment = require("../models/Enrollment");
const Attendance = require("../models/Attendance");
const Section = require("../models/Section");
const User = require("../models/User");
const RecordBook = require("../models/RecordBook");

const uploadProfile = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, "uploads/profilePics/"),
    filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname))
  }),
  limits: { fileSize: 3 * 1024 * 1024 }
});

// POST /api/attendance/mark  -> mark attendance (same as academics.markAttendance)
router.post("/attendance/mark", authRequired, requireAnyRole(["Admin","Registrar","Moderator"]), (req, res, next) => {
  return academics.markAttendance(req, res, next);
});

// GET /api/attendance/my -> return attendance for current student
router.get("/attendance/my", authRequired, async (req, res) => {
  try {
    const studentId = req.user?.id || req.session.user?.id;
    if (!studentId) return res.status(401).json({ message: "Unauthorized" });
    const recs = await Attendance.find({ studentId }).sort({ date: -1 }).limit(365);
    res.json(recs);
  } catch (err) {
    res.status(500).json({ message: "Error fetching attendance", error: err.message });
  }
});

// GET /api/attendance/audit -> admin/registrar/monitor: query attendance logs
router.get("/attendance/audit", authRequired, requireAnyRole(["Admin","Registrar","Moderator"]), async (req, res) => {
  try {
    const q = {};
    if (req.query.studentId) q.studentId = req.query.studentId;
    if (req.query.from || req.query.to) {
      q.date = {};
      if (req.query.from) q.date.$gte = new Date(req.query.from);
      if (req.query.to) q.date.$lte = new Date(req.query.to);
    }
    const recs = await Attendance.find(q).limit(1000).sort({ date: -1 });
    res.json(recs);
  } catch (err) {
    res.status(500).json({ message: "Error fetching audit", error: err.message });
  }
});

// GET /api/enrollment/enrolled -> list approved enrollments
router.get("/enrollment/enrolled", authRequired, requireAnyRole(["Admin","Registrar"]), async (req, res) => {
  try {
    const list = await Enrollment.find({ status: "approved" }).populate("assignedSection");
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: "Error fetching enrolled list", error: err.message });
  }
});

// POST /api/profile/update -> update current user's profile
router.post("/profile/update", authRequired, async (req, res) => {
  try {
    const uid = req.user?.id || req.session.user?.id;
    if (!uid) return res.status(401).json({ message: "Unauthorized" });
    const allowed = ["firstName","lastName","middleName","lrn","phone","address","bio"];
    const update = {};
    for (const k of allowed) if (k in req.body) update[k] = req.body[k];
    const user = await User.findByIdAndUpdate(uid, update, { new: true });
    res.json({ message: "Profile updated", user });
  } catch (err) {
    res.status(500).json({ message: "Error updating profile", error: err.message });
  }
});

// POST /api/profile/uploadPic -> upload profile picture and update user.profilePic
router.post("/profile/uploadPic", authRequired, uploadProfile.single("picture"), async (req, res) => {
  try {
    const uid = req.user?.id || req.session.user?.id;
    if (!uid) return res.status(401).json({ message: "Unauthorized" });
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    const rel = req.file.path.replace(/\\/g, "/");
    const user = await User.findByIdAndUpdate(uid, { profilePic: rel }, { new: true });
    res.json({ message: "Uploaded", file: rel, user });
  } catch (err) {
    res.status(500).json({ message: "Error uploading pic", error: err.message });
  }
});

// POST /api/recordbook/upload -> call existing controller if present
router.post("/recordbook/upload", authRequired, requireAnyRole(["Admin","Registrar","Moderator"]), async (req, res) => {
  try {
    if (academics.createRecordBook) {
      return academics.createRecordBook(req, res);
    }
    return res.status(501).json({ message: "Not implemented on server" });
  } catch (err) {
    res.status(500).json({ message: "Error uploading recordbook", error: err.message });
  }
});

// POST /api/recordbook/finalize -> mark a recordbook as finalized
router.post("/recordbook/finalize", authRequired, requireAnyRole(["Admin","Registrar"]), async (req, res) => {
  try {
    const { id } = req.body;
    if (!id) return res.status(400).json({ message: "Missing id" });
    const rb = await RecordBook.findByIdAndUpdate(id, { finalized: true }, { new: true });
    if (!rb) return res.status(404).json({ message: "RecordBook not found" });
    res.json({ message: "Finalized", rb });
  } catch (err) {
    res.status(500).json({ message: "Error finalizing", error: err.message });
  }
});

// GET /api/admin/department -> list sections/departments
router.get("/admin/department", authRequired, requireAnyRole(["Admin","Registrar"]), async (req, res) => {
  try {
    const sections = await Section.find({}).limit(1000).sort({ gradeLevel: 1, name: 1 });
    res.json(sections);
  } catch (err) {
    res.status(500).json({ message: "Error fetching departments", error: err.message });
  }
});

module.exports = router;
