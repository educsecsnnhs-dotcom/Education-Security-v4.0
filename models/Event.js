// models/Event.js
const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: { 
      type: String, 
      required: true 
    }, // Title of the event (e.g., "Graduation Ceremony")
    description: { 
      type: String 
    }, // Description or additional details about the event
    date: { 
      type: Date, 
      required: true 
    }, // The event's date
    location: { 
      type: String 
    }, // Location where the event is happening (e.g., "Auditorium")
    schoolYear: { 
      type: String, 
      required: true 
    }, // School year this event corresponds to (e.g., "2025-2026")
    createdBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    }, // References the User who created the event (usually an Admin or SuperAdmin)
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt fields
);

module.exports = mongoose.model("Event", eventSchema);
