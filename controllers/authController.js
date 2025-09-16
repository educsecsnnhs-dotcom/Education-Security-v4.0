// controllers/authController.js
const User = require("../models/User");
const { encryptPassword, decryptPassword } = require("../utils/caesar");

// REGISTER
exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const encryptedPass = encryptPassword(password);

    const newUser = new User({
      email,
      password: encryptedPass,
      role: "User", // default role
      extraRoles: [],
    });

    await newUser.save();
    res.status(201).json({ message: "✅ Registration successful" });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const decrypted = decryptPassword(user.password);
    if (decrypted !== password) {
      return res.status(400).json({ message: "Invalid credentials" });
    }

    const userInfo = {
      id: user._id,
      email: user.email,
      role: user.role,
      extraRoles: user.extraRoles,
    };

    res.json({ message: "✅ Login successful", user: userInfo });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// LOGOUT
exports.logout = (req, res) => {
  res.json({ message: "✅ Logged out" });
};

// CURRENT USER (placeholder since no sessions/tokens are used)
exports.me = (req, res) => {
  res.json({ message: "ℹ️ No session tracking in this system" });
};
