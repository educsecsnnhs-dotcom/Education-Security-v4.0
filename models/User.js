const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true, // Optional: Clean input by trimming any extra spaces
    },
    password: {
      type: String,
      required: true,
      minlength: 6, // Optional: Ensure password strength
    },
    role: {
      type: String,
      enum: ["User", "Student", "Moderator", "Admin", "SuperAdmin"],
      default: "User",
    },
    extraRoles: {
      type: [String], // For SSG or other add-ons
      default: [],
    },
  },
  { timestamps: true } // Include createdAt and updatedAt automatically
);

// Optional: Virtual for full name or other user-related attributes
userSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`; // This can be adjusted to suit your data model
});

// You could also add pre-save hooks if you need to hash passwords or perform other actions before saving
// e.g. hash password before saving (if using bcrypt or another hashing method)

// userSchema.pre('save', async function(next) {
//   if (this.isModified('password')) {
//     this.password = await bcrypt.hash(this.password, 10);
//   }
//   next();
// });

module.exports = mongoose.model("User", userSchema);
