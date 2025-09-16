// controllers/authController.js
const User = require("../models/User");
const { encryptPassword, decryptPassword } = require("../utils/caesar");

// REGISTER
exports.register = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).send("Email and password are required");

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).send("Email already registered");

    const encryptedPass = encryptPassword(password);

    const newUser = new User({
      email,
      password: encryptedPass,
      role: "User", // default
      extraRoles: [],
    });

    await newUser.save();
    res.status(201).send("✅ Registration successful");
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).send("Server error");
  }
};

// LOGIN
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).send("Email and password are required");

    const user = await User.findOne({ email });
    if (!user) return res.status(400).send("Invalid credentials");

    const decrypted = decryptPassword(user.password);
    if (decrypted !== password)
      return res.status(400).send("Invalid credentials");

    // ✅ Store session
    req.session.user = {
      id: user._id,
      email: user.email,
      role: user.role,
      extraRoles: user.extraRoles,
    };

    res.json({ message: "✅ Login successful", user: req.session.user });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send("Server error");
  }
};

// LOGOUT
exports.logout = (req, res) => {
  const cookieName = process.env.SESSION_NAME || "sid";

  req.session.destroy(() => {
    res.clearCookie(cookieName, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
    });
    res.send("✅ Logged out");
  });
};

// SESSION CHECK
exports.me = (req, res) => {
  if (!req.session.user) return res.status(401).send("Not logged in");
  res.json(req.session.user);
};
