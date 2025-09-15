// models/SSGAnnouncement.js
const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  createdBy: { type: String, required: true }, // username or userId
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SSGAnnouncement', AnnouncementSchema);
