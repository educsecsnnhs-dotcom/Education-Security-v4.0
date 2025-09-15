//seedAdmin.js

const User = require("./models/User");
const { encryptPassword } = require("./utils/caesar");

async function seedAdmin() {
  try {
    const email = process.env.SUPERADMIN_EMAIL || "superadmin@school.com";
    const password = process.env.SUPERADMIN_PASSWORD || "superadmin123";

    let existing = await User.findOne({ role: "SuperAdmin" });
    if (existing) {
      console.log("✅ SuperAdmin already exists:", existing.email);
      return;
    }

    const superAdmin = new User({
      email,
      password: encryptPassword(password), 
      role: "SuperAdmin",
      extraRoles: [],
    });

    await superAdmin.save();
    console.log("🎉 SuperAdmin created:", email);
  } catch (err) {
    console.error("❌ Error seeding SuperAdmin:", err.message);
  }
}

module.exports = seedAdmin; 
