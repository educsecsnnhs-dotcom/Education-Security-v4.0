// models/SSGAnnouncement.js
const mongoose = require('mongoose');

const AnnouncementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  body: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // userId as ObjectId
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('SSGAnnouncement', AnnouncementSchema);
