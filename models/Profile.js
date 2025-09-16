// models/Profile.js
const mongoose = require("mongoose");

const profileSchema = new mongoose.Schema(
  {
    userId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: "User", 
      required: true 
    }, // Reference to the associated User model
    avatar: { 
      type: String, 
      default: null 
    }, // Profile picture, default is null
    bio: { 
      type: String, 
      default: "" 
    }, // Bio or personal description
    contactNumber: { 
      type: String, 
      default: "" 
    }, // Contact number
    address: { 
      type: String, 
      default: "" 
    }, // User's physical address
    guardianName: { 
      type: String 
    },   // For students, name of their guardian (optional)
    guardianContact: { 
      type: String 
    } // Optional contact for guardian
  },
  { timestamps: true } // Automatically manage createdAt and updatedAt fields
);

module.exports = mongoose.model("Profile", profileSchema);
