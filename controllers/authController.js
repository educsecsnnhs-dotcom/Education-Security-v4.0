const jwt = require("jsonwebtoken");
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
      role: "User",
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
    if (decrypted !== password) return res.status(400).send("Invalid credentials");

    const payload = {
      id: user._id,
      email: user.email,
      role: user.role,
      extraRoles: user.extraRoles,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || "change_me_now", {
      expiresIn: "7d",
    });

    res.json({ message: "✅ Login successful", token, user: payload });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).send("Server error");
  }
};

// LOGOUT (JWT is stateless — client just discards token)
exports.logout = (req, res) => {
  res.send("✅ Logged out (client must delete token)");
};

// SESSION CHECK (decode token)
exports.me = (req, res) => {
  if (!req.user) return res.status(401).send("Not logged in");
  res.json(req.user);
};
