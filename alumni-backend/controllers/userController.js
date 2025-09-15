const User = require("../models/User");
const StudentProfile = require("../models/StudentProfile");
const AlumniProfile = require("../models/AlumniProfile");

// GET logged in user + profile
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    let profile = null;

    if (user.role === "student") {
      profile = await StudentProfile.findOne({ user: req.user.id });
    } else if (user.role === "alumni") {
      profile = await AlumniProfile.findOne({ user: req.user.id });
    }

    res.json({ user, profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};

// UPDATE logged in user profile
exports.updateMe = async (req, res) => {
  try {
    const userId = req.user.id;

    // Update basic User info
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name: req.body.name, email: req.body.email },
      { new: true }
    ).select("-password");

    let profile = null;

    if (updatedUser.role === "student") {
      profile = await StudentProfile.findOneAndUpdate(
        { user: userId },
        { $set: req.body },
        { new: true, upsert: true }
      );
    } else if (updatedUser.role === "alumni") {
      profile = await AlumniProfile.findOneAndUpdate(
        { user: userId },
        { $set: req.body },
        { new: true, upsert: true }
      );
    }

    res.json({ user: updatedUser, profile });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};
