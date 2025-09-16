// controllers/alumniController.js
const User = require("../models/User");

// 🎓 Get all verified alumni
const getVerifiedAlumni = async (req, res) => {
  try {
    const alumni = await User.find({
      role: "alumni",
      verified: true,
    }).select("-password -__v"); // Hide sensitive/unnecessary fields

    return res.json({
      success: true,
      count: alumni.length,
      alumni,
    });
  } catch (err) {
    console.error("Error fetching verified alumni:", err);
    return res.status(500).json({
      success: false,
      msg: "Server error",
      error: err.message,
    });
  }
};

module.exports = { getVerifiedAlumni };
