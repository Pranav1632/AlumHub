const User = require("../models/User");
const StudentProfile = require("../models/StudentProfile");

// GET logged in user
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // also fetch student profile if role is student
    let profile = null;
    if (user.role === "student") {
      profile = await StudentProfile.findOne({ user: req.user.id });
    }

    res.json({ user, profile });
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

// UPDATE profile
exports.updateMe = async (req, res) => {
  try {
    const userId = req.user.id;

    // update User basic info
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name: req.body.name, email: req.body.email }, // update only safe fields
      { new: true }
    ).select("-password");

    // if student, update or create profile
    if (updatedUser.role === "student") {
      let profile = await StudentProfile.findOne({ user: userId });

      if (profile) {
        // update existing
        profile = await StudentProfile.findOneAndUpdate(
          { user: userId },
          { $set: req.body },
          { new: true }
        );
      } else {
        // create new
        profile = new StudentProfile({ user: userId, ...req.body });
        await profile.save();
      }

      return res.json({ user: updatedUser, profile });
    }

    res.json({ user: updatedUser });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};
