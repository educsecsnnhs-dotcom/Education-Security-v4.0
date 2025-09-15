// controllers/superAdminController.js
const User = require("../models/User");
const { encrypt } = require("../utils/caesar");

/**
 * List all users (hide password)
 */
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Error fetching users", error: err.message });
  }
};

/**
 * Update user role (only SuperAdmin can call)
 */
exports.updateUserRole = async (req, res) => {
  try {
    const { userId, role } = req.body;
    const valid = ["Student", "Registrar", "Admin", "Moderator", "SSG", "SuperAdmin", "User"];
    if (!valid.includes(role)) return res.status(400).json({ message: "Invalid role" });
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.role = role;
    await user.save();
    res.json({ message: `Role updated to ${role}`, user: { id: user._id, username: user.username, role: user.role } });
  } catch (err) {
    res.status(500).json({ message: "Error updating role", error: err.message });
  }
};

/**
 * Lock user account (prevent login)
 */
exports.lockUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.locked = true;
    await user.save();
    res.json({ message: "User locked", user: { id: user._id, username: user.username } });
  } catch (err) {
    res.status(500).json({ message: "Error locking user", error: err.message });
  }
};

/**
 * Unlock user account
 */
exports.unlockUser = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });
    user.locked = false;
    await user.save();
    res.json({ message: "User unlocked", user: { id: user._id, username: user.username } });
  } catch (err) {
    res.status(500).json({ message: "Error unlocking user", error: err.message });
  }
};

/**
 * Impersonate a user (helpful for testing) - sets session to target user
 * WARNING: only SuperAdmin should call this in production.
 */
exports.impersonate = async (req, res) => {
  try {
    const { userId } = req.body;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Set minimal session user
    req.session.user = {
      id: user._id.toString(),
      username: user.username,
      role: user.role,
      fullName: user.fullName,
      lrn: user.lrn,
    };
    res.json({ message: "Impersonation active", user: req.session.user });
  } catch (err) {
    res.status(500).json({ message: "Error impersonating", error: err.message });
  }
};
