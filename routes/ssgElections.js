// routes/ssgElections.js
const express = require("express");
const router = express.Router();
const Election = require("../models/Election");
const { authRequired, requireAnyRole } = require("../middleware/authMiddleware");

// GET all elections
router.get("/", async (req, res) => {
  try {
    const elections = await Election.find().sort({ createdAt: -1 });
    res.json(elections);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new election (Admin, SuperAdmin, SSG)
router.post("/", authRequired, requireAnyRole(["Admin", "SuperAdmin", "SSG"]), async (req, res) => {
  try {
    const election = new Election({
      title: req.body.title,
      description: req.body.description,
      createdBy: req.user.id,
    });
    await election.save();
    res.json(election);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE election
router.delete("/:id", authRequired, requireAnyRole(["Admin", "SuperAdmin", "SSG"]), async (req, res) => {
  try {
    const deleted = await Election.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Not found" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
