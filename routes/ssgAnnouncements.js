// routes/ssgAnnouncements.js
const express = require('express');
const router = express.Router();
const Announcement = require('../models/SSGAnnouncement');

// Middleware: ensure logged-in
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
}

// GET all announcements
router.get('/', async (req, res) => {
  try {
    const announcements = await Announcement.find().sort({ createdAt: -1 });
    res.json(announcements);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST new announcement (SSG only)
router.post('/', requireAuth, async (req, res) => {
  try {
    if (req.session.user.role !== 'SSG' && req.session.user.role !== 'SuperAdmin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    const ann = new Announcement({
      title: req.body.title,
      body: req.body.body,
      createdBy: req.session.user.username
    });

    await ann.save();
    res.status(201).json(ann);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE announcement
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    if (req.session.user.role !== 'SSG' && req.session.user.role !== 'SuperAdmin') {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await Announcement.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
