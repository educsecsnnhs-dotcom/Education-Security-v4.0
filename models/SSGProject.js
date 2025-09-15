// models/SSGProject.js
const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['Planned', 'Ongoing', 'Completed'], default: 'Planned' },
  createdBy: { type: String, required: true }, // username or userId
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SSGProject', ProjectSchema);
