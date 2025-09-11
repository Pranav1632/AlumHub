// routes/authRoutes.js
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { signup } = require("../controllers/authController");

const router = express.Router();

// Signup (common for all roles)
router.post("/signup", signup);

// Login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ msg: "Email and password required" });

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ msg: "Invalid credentials" });

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ msg: "Invalid credentials" });

    // Verification check
    if (user.role !== "collegeAdmin" && !user.verified) {
      return res
        .status(403)
        .json({ msg: "Account not verified yet. Please wait for approval." });
    }

    // Sign JWT token
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      role: user.role,
      email: user.email,
      name: user.name,
      prn: user.prn,
      instituteCode: user.instituteCode,
      verified: user.verified,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
});

module.exports = router;
