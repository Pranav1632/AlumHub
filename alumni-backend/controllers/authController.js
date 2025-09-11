// controllers/authController.js
const User = require("../models/User");
const bcrypt = require("bcryptjs");

/**
 * Signup Controller
 */
exports.signup = async (req, res) => {
  try {
    const { name, email, password, confirmPassword, role, prn, instituteCode } = req.body;

    // required fields
    if (!name || !email || !password || !confirmPassword || !role) {
      return res.status(400).json({ msg: "All required fields must be provided" });
    }

    // check password match
    if (password !== confirmPassword) {
      return res.status(400).json({ msg: "Passwords do not match" });
    }

    // enforce role-specific requirements
    if ((role === "student" || role === "alumni") && !prn) {
      return res.status(400).json({ msg: "PRN is required for students and alumni" });
    }
    if (role === "collegeAdmin" && !instituteCode) {
      return res.status(400).json({ msg: "Institute code is required for college admins" });
    }

    // check duplicate email
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ msg: "Email already registered" });
    }

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // verification rule
    let verified = false;
    if (role === "collegeAdmin") {
      // College admin verification will be handled manually in DB
      verified = false;
    } else if (role === "student" || role === "alumni") {
      // must be verified later by college admin
      verified = false;
    }

    const newUser = new User({
      name,
      email,
      password: hashedPassword,
      role,
      prn: prn || undefined,
      instituteCode: instituteCode || undefined,
      verified,
    });

    await newUser.save();

    res.status(201).json({
      msg: "Signup successful, wait for verification if required",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        verified: newUser.verified,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};
