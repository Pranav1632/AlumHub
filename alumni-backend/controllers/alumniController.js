// controllers/alumniController.js
const User = require("../models/User");

// Get all verified alumni
const getVerifiedAlumni = async (req, res) => {
  try {
    const alumni = await User.find({
      role: "alumni",
      verified: true,
    }).select("-password"); // hide password field

    res.json({ count: alumni.length, alumni });
  } catch (err) {
    console.error("Error fetching verified alumni:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

module.exports = { getVerifiedAlumni };
