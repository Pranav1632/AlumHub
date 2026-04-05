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
    const nextName = String(req.body?.name || "").trim();
    const nextEmail = String(req.body?.email || "").trim().toLowerCase();
    const nextPhone = String(req.body?.phone || "").trim();

    const updatedUser = await User.findOneAndUpdate(
      { _id: userId, collegeId: req.user.collegeId },
      { name: nextName, email: nextEmail, phone: nextPhone || req.user.phone || "" },
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

exports.getStudentVisitProfile = async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Only students can visit student profiles" });
    }

    const target = await User.findOne({
      _id: req.params.id,
      collegeId: req.user.collegeId,
      role: "student",
      blocked: false,
      verified: true,
    }).select("-password");

    if (!target) {
      return res.status(404).json({ message: "Student profile not found in your college" });
    }

    const profile = await StudentProfile.findOne({
      user: target._id,
      collegeId: req.user.collegeId,
    }).select("-_id -__v -user -collegeId");

    return res.json({
      user: target,
      profile: profile || null,
    });
  } catch (err) {
    console.error("getStudentVisitProfile error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

exports.getPublicProfile = async (req, res) => {
  try {
    const target = await User.findOne({
      _id: req.params.id,
      collegeId: req.user.collegeId,
      blocked: false,
    }).select("-password");

    if (!target) {
      return res.status(404).json({ message: "Profile not found in your college" });
    }

    if ((target.role === "student" || target.role === "alumni") && !target.verified) {
      return res.status(404).json({ message: "Profile not available yet" });
    }

    let profile = null;
    if (target.role === "student") {
      profile = await StudentProfile.findOne({
        user: target._id,
        collegeId: req.user.collegeId,
      }).select("-__v -collegeId");
    } else if (target.role === "alumni") {
      profile = await AlumniProfile.findOne({
        user: target._id,
        collegeId: req.user.collegeId,
      }).select("-__v -collegeId");
    }

    return res.json({
      user: target,
      profile: profile || null,
    });
  } catch (err) {
    console.error("getPublicProfile error:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};
