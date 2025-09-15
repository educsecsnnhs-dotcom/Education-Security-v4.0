// routes/ssgElections.js
const express = require('express');
const router = express.Router();
const Election = require('../models/Election');

// middleware: must be logged in
function requireAuth(req, res, next) {
  if (!req.session.user) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

// middleware: must be admin/superadmin/ssg
function requireSSG(req, res, next) {
  const role = req.session.user?.role;
  if (['Admin', 'SuperAdmin', 'SSG'].includes(role)) return next();
  return res.status(403).json({ error: 'Forbidden' });
}

// GET all elections
router.get('/', requireAuth, async (req, res) => {
  try {
    const elections = await Election.find().sort({ createdAt: -1 });
    res.json(elections);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST new election
router.post('/', requireAuth, requireSSG, async (req, res) => {
  try {
    const election = new Election({
      title: req.body.title,
      description: req.body.description,
      createdBy: req.session.user._id,
    });
    await election.save();
    res.json(election);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE election
router.delete('/:id', requireAuth, requireSSG, async (req, res) => {
  try {
    const deleted = await Election.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ error: 'Not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
