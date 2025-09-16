// models/Enrollment.js
const mongoose = require("mongoose");

const enrollmentSchema = new mongoose.Schema(
  {
    studentId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    }, // References the user (student) being enrolled
    name: { 
      type: String, 
      required: true 
    }, // Full name of the student
    lrn: { 
      type: String, 
      required: true, 
      validate: {
        validator: function(v) {
          return /^\d{12}$/.test(v); // LRN must be a 12-digit number
        },
        message: "LRN must be a 12-digit number",
      },
    },
    level: { 
      type: String, 
      enum: ["junior", "senior"], 
      required: true 
    }, // Grade level (junior or senior)
    strand: { 
      type: String 
    }, // Optional strand for senior students (e.g., STEM, ABM, etc.)
    section: { 
      type: String, 
      default: null 
    }, // Assigned section for the student (if approved)
    schoolYear: { 
      type: String, 
      required: true 
    }, // The school year (e.g., "2025-2026")
    yearLevel: { 
      type: Number 
    }, // The student's year level (e.g., 1st year, 2nd year, etc.)

    status: { 
      type: String, 
      enum: ["pending", "approved", "rejected"], 
      default: "pending" 
    }, // The enrollment status (default is "pending")

    documents: {
      reportCard: { 
        type: String 
      }, // Report card document file name
      goodMoral: { 
        type: String 
      }, // Good moral character document file name
      birthCertificate: { 
        type: String 
      }, // Birth certificate document file name
      others: [{ 
        type: String 
      }], // Other documents (if any)
    },

    graduated: { 
      type: Boolean, 
      default: false 
    }, // Flag to indicate if the student has graduated

    archived: { 
      type: Boolean, 
      default: false 
    }, // Flag to indicate if the enrollment record is archived
    archiveReason: { 
      type: String, 
      default: null 
    }, // Reason for archiving the record (if applicable)
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

module.exports = mongoose.model("Enrollment", enrollmentSchema);
