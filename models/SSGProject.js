// models/SSGProject.js
const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  status: { type: String, enum: ['Planned', 'Ongoing', 'Completed'], default: 'Planned' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // userId as ObjectId
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SSGProject', ProjectSchema);
