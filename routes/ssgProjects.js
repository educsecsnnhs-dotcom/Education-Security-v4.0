// routes/ssgProjects.js
const express = require("express");
const router = express.Router();
const Project = require("../models/SSGProject");
const { authRequired, requireAnyRole } = require("../middleware/authMiddleware");

// GET all projects
router.get("/", async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new project (SSG or SuperAdmin only)
router.post("/", authRequired, requireAnyRole(["SSG", "SuperAdmin"]), async (req, res) => {
  try {
    const project = new Project({
      name: req.body.name,
      description: req.body.description,
      status: req.body.status || "Planned",
      createdBy: req.user.username,
    });

    await project.save();
    res.status(201).json(project);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH project status
router.patch("/:id", authRequired, requireAnyRole(["SSG", "SuperAdmin"]), async (req, res) => {
  try {
    const project = await Project.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.json(project);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE project
router.delete("/:id", authRequired, requireAnyRole(["SSG", "SuperAdmin"]), async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
