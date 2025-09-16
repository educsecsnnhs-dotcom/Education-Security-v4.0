// routes/ssgAnnouncements.js
const express = require("express");
const router = express.Router();
const Announcement = require("../models/SSGAnnouncement");
const { authRequired, requireAnyRole } = require("../middleware/authMiddleware");

// GET all announcements
router.get("/", async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new announcement (SSG or SuperAdmin only)
router.post("/", authRequired, requireAnyRole(["SSG", "SuperAdmin"]), async (req, res) => {
  try {
    const ann = new Announcement({
      title: req.body.title,
      body: req.body.body,
      createdBy: req.user.username,
    });

    await ann.save();
    res.status(201).json(ann);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE announcement
router.delete("/:id", authRequired, requireAnyRole(["SSG", "SuperAdmin"]), async (req, res) => {
  try {
    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;

