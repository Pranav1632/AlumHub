const User = require("../models/User");
const StudentProfile = require("../models/StudentProfile");
const AlumniProfile = require("../models/AlumniProfile");

exports.getMe = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.user.id, collegeId: req.user.collegeId }).select(
      "-password"
    );
    if (!user) return res.status(404).json({ message: "User not found" });

    let profile = null;
    if (user.role === "student") {
      profile = await StudentProfile.findOne({ user: req.user.id, collegeId: req.user.collegeId });
    } else if (user.role === "alumni") {
      profile = await AlumniProfile.findOne({ user: req.user.id, collegeId: req.user.collegeId });
    }

    return res.json({ user, profile });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server Error" });
  }
};

exports.updateMe = async (req, res) => {
  try {
    const userId = req.user.id;

    const updatedUser = await User.findOneAndUpdate(
      { _id: userId, collegeId: req.user.collegeId },
      { name: req.body.name, email: req.body.email },
      { new: true }
    ).select("-password");

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    let profile = null;
    const profilePayload = { ...req.body, collegeId: req.user.collegeId };

    if (updatedUser.role === "student") {
      profile = await StudentProfile.findOneAndUpdate(
        { user: userId, collegeId: req.user.collegeId },
        { $set: profilePayload },
        { new: true, upsert: true }
      );
    } else if (updatedUser.role === "alumni") {
      profile = await AlumniProfile.findOneAndUpdate(
        { user: userId, collegeId: req.user.collegeId },
        { $set: profilePayload },
        { new: true, upsert: true }
      );
    }

    return res.json({ user: updatedUser, profile });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server Error" });
  }
};