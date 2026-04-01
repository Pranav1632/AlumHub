const User = require("../models/User");

const getVerifiedAlumni = async (req, res) => {
  try {
    const alumni = await User.find({
      role: "alumni",
      verified: true,
      blocked: false,
      collegeId: req.user.collegeId,
    }).select("-password -__v");

    return res.json({ success: true, count: alumni.length, alumni });
  } catch (err) {
    console.error("Error fetching verified alumni:", err);
    return res.status(500).json({ success: false, msg: "Server error", error: err.message });
  }
};

module.exports = { getVerifiedAlumni };