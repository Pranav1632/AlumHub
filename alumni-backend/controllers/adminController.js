const User = require("../models/User");

/**
 * Verify a student or alumni by ID
 */
const verifyUser = async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target) return res.status(404).json({ msg: "User not found" });

    if (!["student", "alumni"].includes(target.role)) {
      return res
        .status(400)
        .json({ msg: `Cannot verify a '${target.role}' via this endpoint` });
    }

    if (target.verified) {
      return res.status(400).json({ msg: "User is already verified" });
    }

    target.verified = true;
    await target.save();

    res.json({
      msg: "User verified successfully",
      user: {
        _id: target._id,
        name: target.name,
        role: target.role,
        email: target.email,
        prn: target.prn,
        verified: target.verified,
      },
    });
  } catch (err) {
    console.error("Verify user error:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

/**
 * List pending (unverified) students/alumni
 */
const listPendingUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const roleFilter =
      role && ["student", "alumni"].includes(role)
        ? role
        : { $in: ["student", "alumni"] };

    const users = await User.find({
      role: roleFilter,
      verified: false,
    }).select("-password");

    res.json({ count: users.length, users });
  } catch (err) {
    console.error("Pending list error:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

/**
 * Get all students
 */
const getAllStudents = async (req, res) => {
  try {
    const students = await User.find({ role: "student" }).select("-password");
    res.json(students);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

/**
 * Get all alumni
 */
const getAllAlumni = async (req, res) => {
  try {
    const alumni = await User.find({ role: "alumni" }).select("-password");
    res.json(alumni);
  } catch (err) {
    res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  verifyUser,
  listPendingUsers,
  getAllStudents,
  getAllAlumni,
};
