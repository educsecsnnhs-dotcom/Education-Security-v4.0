// routes/ssgProjects.js
// Handles SSG projects (CRUD)

const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');

// ------------------------------
// Mongoose Schema
// ------------------------------
const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['Planned', 'Ongoing', 'Completed'], default: 'Planned' },
  createdBy: { type: String, required: true }, // username or userId
  createdAt: { type: Date, default: Date.now }
});

const Project = mongoose.model('SSGProject', ProjectSchema);

// ------------------------------
// Middleware: ensure logged-in
// ------------------------------
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
}

// ------------------------------
// Routes
// ------------------------------

// GET all projects
router.get('/', async (req, res) => {
  try {
    const projects = await Project.find().sort({ createdAt: -1 });
    res.json(projects);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new project (SSG only)
router.post('/', requireAuth, async (req, res) => {
  try {
    if (req.session.user.role !== 'SSG' && req.session.user.role !== 'SuperAdmin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const project = new Project({
      name: req.body.name,
      description: req.body.description,
      status: req.body.status || 'Planned',
      createdBy: req.session.user.username
    });

    await project.save();
    res.status(201).json(project);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// PATCH project status
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    if (req.session.user.role !== 'SSG' && req.session.user.role !== 'SuperAdmin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

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
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    if (req.session.user.role !== 'SSG' && req.session.user.role !== 'SuperAdmin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
