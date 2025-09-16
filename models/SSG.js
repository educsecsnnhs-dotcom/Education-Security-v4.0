const mongoose = require("mongoose");

/**
 * SSG Schema — combines elections, candidates, events, posts, and votes.
 */
const candidateSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  gradeLevel: { type: Number, required: true },
  position: { type: String, required: true }, // e.g., President, VP
  votes: { type: Number, default: 0 },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

const electionSchema = new mongoose.Schema({
  title: { type: String, required: true }, // e.g., "SSG Election 2025"
  schoolYear: { type: String, required: true },
  candidates: [candidateSchema],
  isActive: { type: Boolean, default: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
});

const eventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String },
  date: { type: Date, required: true },
  location: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
});

const postSchema = new mongoose.Schema({
  content: { type: String, required: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  createdAt: { type: Date, default: Date.now },
});

const voteSchema = new mongoose.Schema({
  electionId: { type: mongoose.Schema.Types.ObjectId, ref: "SSG.elections", required: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, required: true },
  voter: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  castAt: { type: Date, default: Date.now },
});

const ssgSchema = new mongoose.Schema(
  {
    elections: [electionSchema],
    events: [eventSchema],
    posts: [postSchema],
    votes: [voteSchema],
  },
  { timestamps: true } // Automatically handles creation and update timestamps
);

module.exports = mongoose.model("SSG", ssgSchema);
