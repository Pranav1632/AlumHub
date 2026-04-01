const User = require("../models/User");

const normalizeRole = (role) => (role === "collegeAdmin" ? "admin" : role);

const collegeScopedFilter = (req, extra = {}) => ({
  collegeId: req.user.collegeId,
  ...extra,
});

const verifyUser = async (req, res) => {
  try {
    const target = await User.findOne(
      collegeScopedFilter(req, { _id: req.params.id })
    );

    if (!target) return res.status(404).json({ msg: "User not found in your college" });

    if (!["student", "alumni"].includes(normalizeRole(target.role))) {
      return res.status(400).json({ msg: `Cannot verify ${target.role}` });
    }

    if (target.verified) {
      return res.status(400).json({ msg: "User is already verified" });
    }

    target.verified = true;
    await target.save();

    return res.json({ msg: "User verified successfully", user: target });
  } catch (err) {
    console.error("Verify user error:", err);
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};

const listPendingUsers = async (req, res) => {
  try {
    const { role } = req.query;
    const roleFilter =
      role && ["student", "alumni"].includes(role)
        ? role
        : { $in: ["student", "alumni"] };

    const users = await User.find(
      collegeScopedFilter(req, {
        role: roleFilter,
        verified: false,
      })
    ).select("-password");

    return res.json({ count: users.length, users });
  } catch (err) {
    console.error("Pending list error:", err);
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};

const getAllStudents = async (req, res) => {
  try {
    const students = await User.find(
      collegeScopedFilter(req, { role: "student" })
    ).select("-password");
    return res.json(students);
  } catch (err) {
    return res.status(500).json({ message: "Server Error" });
  }
};

const getAllAlumni = async (req, res) => {
  try {
    const alumni = await User.find(
      collegeScopedFilter(req, { role: "alumni" })
    ).select("-password");
    return res.json(alumni);
  } catch (err) {
    return res.status(500).json({ message: "Server Error" });
  }
};

const blockUser = async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      collegeScopedFilter(req, { _id: req.params.id }),
      { blocked: true },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ msg: "User not found" });
    return res.json({ msg: "User blocked", user });
  } catch (err) {
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};

const unblockUser = async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      collegeScopedFilter(req, { _id: req.params.id }),
      { blocked: false },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ msg: "User not found" });
    return res.json({ msg: "User unblocked", user });
  } catch (err) {
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};

module.exports = {
  verifyUser,
  listPendingUsers,
  getAllStudents,
  getAllAlumni,
  blockUser,
  unblockUser,
};