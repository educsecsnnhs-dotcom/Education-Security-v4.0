// models/Election.js
const mongoose = require('mongoose');

const ElectionSchema = new mongoose.Schema(
  {
    title: { type: String, required: true }, // Title of the election
    description: { type: String }, // Optional description of the election
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Creator (SuperAdmin, Admin, etc.)
  },
  { timestamps: true }
);

module.exports = mongoose.model('Election', ElectionSchema);
