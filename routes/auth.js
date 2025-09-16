// routes/auth.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

router.post("/register", authController.register);
router.post("/login", authController.login);   // issues JWT
router.post("/logout", authController.logout); // client just discards token
router.get("/me", authController.me);          // checks JWT

module.exports = router;

