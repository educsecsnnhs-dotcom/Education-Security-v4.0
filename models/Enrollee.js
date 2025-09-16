// models/Enrollee.js
const mongoose = require("mongoose");

const enrolleeSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true }, // Full name of the enrollee
    lrn: { type: String, required: true, unique: true }, // Learner Reference Number (unique)
    gradeLevel: { type: Number, required: true }, // Grade level (e.g., 7–12)
    strand: { type: String }, // Optional strand for Senior High School (SHS) students
    schoolYear: { type: String, required: true }, // The school year (e.g., "2025-2026")
    status: { 
      type: String, 
      enum: ["Pending", "Approved", "Rejected"], 
      default: "Pending" 
    }, // Enrollment status (default is "Pending")
    assignedSection: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Section" 
    }, // Section the enrollee is assigned to, if approved
    createdBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User" 
    }, // User who created the enrollee record (Registrar or Admin)
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

module.exports = mongoose.model("Enrollee", enrolleeSchema);
