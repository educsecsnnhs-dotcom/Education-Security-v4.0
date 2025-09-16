// models/RecordBook.js
const mongoose = require("mongoose");

const recordBookSchema = new mongoose.Schema(
  {
    sectionId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "Section", 
      required: true 
    }, // Reference to the associated Section model
    subject: { 
      type: String, 
      required: true 
    }, // The subject for which the record book is created
    sheetId: { 
      type: String, 
      required: true 
    }, // Google Sheet ID (used for grades or data storage)
    partial: { 
      type: Boolean, 
      default: false 
    }, // Whether the record is partial (false = finalized)
  },
  { timestamps: true } // Automatically manage createdAt and updatedAt fields
);

module.exports = mongoose.model("RecordBook", recordBookSchema);
