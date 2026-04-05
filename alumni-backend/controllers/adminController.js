const User = require("../models/User");
const StudentProfile = require("../models/StudentProfile");
const AlumniProfile = require("../models/AlumniProfile");
const Discussion = require("../models/Discussion");
const Feedback = require("../models/Feedback");
const Event = require("../models/Event");
const Message = require("../models/Message");
const MentorshipRequest = require("../models/MentorshipRequest");
const { notifyUser } = require("../utils/notificationService");

const normalizeRole = (role) => (role === "collegeAdmin" ? "admin" : role);

const collegeScopedFilter = (req, extra = {}) => ({
  collegeId: req.user.collegeId,
  ...extra,
});

const buildSearchRegex = (value) => {
  const text = String(value || "").trim();
  if (!text) return null;
  return new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
};

const profileProjection =
  "phone branch yearOfStudy graduationYear currentCompany jobTitle location skills interests achievements bio headline profileImage";

const mapProfilesByUser = async ({ collegeId, users }) => {
  const ids = users.map((user) => user._id);
  if (ids.length === 0) return new Map();

  const [studentProfiles, alumniProfiles] = await Promise.all([
    StudentProfile.find({ collegeId, user: { $in: ids } }).select(`user ${profileProjection}`).lean(),
    AlumniProfile.find({ collegeId, user: { $in: ids } }).select(`user ${profileProjection}`).lean(),
  ]);

  const profileMap = new Map();
  studentProfiles.forEach((profile) => profileMap.set(String(profile.user), profile));
  alumniProfiles.forEach((profile) => profileMap.set(String(profile.user), profile));
  return profileMap;
};

const mergeUserWithProfile = (user, profileMap) => {
  const role = normalizeRole(user.role);
  const profile = profileMap.get(String(user._id)) || null;

  return {
    ...user.toObject(),
    role,
    profile,
  };
};

const verifyUser = async (req, res) => {
  try {
    const target = await User.findOne(collegeScopedFilter(req, { _id: req.params.id }));

    if (!target) return res.status(404).json({ msg: "User not found in your college" });

    if (!["student", "alumni"].includes(normalizeRole(target.role))) {
      return res.status(400).json({ msg: `Cannot verify ${target.role}` });
    }

    if (!target.emailVerified) {
      return res.status(400).json({ msg: "User email is not verified yet" });
    }

    if (target.verified) {
      return res.status(400).json({ msg: "User is already verified" });
    }

    target.verified = true;
    await target.save();

    const io = req.app.get("io");
    await notifyUser({
      io,
      collegeId: req.user.collegeId,
      userId: target._id,
      type: "admin_action",
      title: "Account Verified",
      message: "Your AlumHub account has been verified by admin.",
      meta: { action: "verify_user", adminId: req.user._id },
    });

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
      role && ["student", "alumni"].includes(role) ? role : { $in: ["student", "alumni"] };

    const users = await User.find(
      collegeScopedFilter(req, {
        role: roleFilter,
        verified: false,
      })
    )
      .select("-password")
      .sort({ createdAt: -1 });

    const profileMap = await mapProfilesByUser({ collegeId: req.user.collegeId, users });
    const detailedUsers = users.map((user) => mergeUserWithProfile(user, profileMap));

    return res.json({ count: detailedUsers.length, users: detailedUsers });
  } catch (err) {
    console.error("Pending list error:", err);
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};

const listUsers = async (req, res) => {
  try {
    const roleFilter =
      req.query.role && ["student", "alumni"].includes(req.query.role)
        ? req.query.role
        : { $in: ["student", "alumni"] };

    const filter = collegeScopedFilter(req, { role: roleFilter });

    if (req.query.verified === "true") filter.verified = true;
    if (req.query.verified === "false") filter.verified = false;
    if (req.query.blocked === "true") filter.blocked = true;
    if (req.query.blocked === "false") filter.blocked = false;

    const searchRegex = buildSearchRegex(req.query.search);
    if (searchRegex) {
      filter.$or = [{ name: searchRegex }, { email: searchRegex }, { prn: searchRegex }, { phone: searchRegex }];
    }

    const users = await User.find(filter).select("-password").sort({ createdAt: -1 });
    const profileMap = await mapProfilesByUser({ collegeId: req.user.collegeId, users });
    const detailedUsers = users.map((user) => mergeUserWithProfile(user, profileMap));

    return res.json({ count: detailedUsers.length, users: detailedUsers });
  } catch (err) {
    console.error("List users error:", err);
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};

const getAllStudents = async (req, res) => {
  try {
    const students = await User.find(collegeScopedFilter(req, { role: "student" })).select("-password");
    return res.json(students);
  } catch (err) {
    return res.status(500).json({ message: "Server Error" });
  }
};

const getAllAlumni = async (req, res) => {
  try {
    const alumni = await User.find(collegeScopedFilter(req, { role: "alumni" })).select("-password");
    return res.json(alumni);
  } catch (err) {
    return res.status(500).json({ message: "Server Error" });
  }
};

const blockUser = async (req, res) => {
  try {
    const reason = String(req.body?.reason || "").trim();

    const user = await User.findOneAndUpdate(
      collegeScopedFilter(req, { _id: req.params.id }),
      {
        blocked: true,
        adminActionReason: reason,
      },
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
      {
        blocked: false,
        adminActionReason: "",
      },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ msg: "User not found" });
    return res.json({ msg: "User unblocked", user });
  } catch (err) {
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};

const setCommunityChatBlock = async (req, res) => {
  try {
    const blocked = Boolean(req.body?.blocked);
    const reason = String(req.body?.reason || "").trim();

    const user = await User.findOneAndUpdate(
      collegeScopedFilter(req, { _id: req.params.id, role: { $in: ["student", "alumni"] } }),
      {
        communityChatBlocked: blocked,
        adminActionReason: reason,
      },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ msg: "User not found" });

    const io = req.app.get("io");
    await notifyUser({
      io,
      collegeId: req.user.collegeId,
      userId: user._id,
      type: "admin_action",
      title: blocked ? "Community Access Restricted" : "Community Access Restored",
      message: blocked
        ? "Admin restricted your community discussion access."
        : "Admin restored your community discussion access.",
      meta: {
        action: "community_chat_access",
        blocked,
        reason,
      },
    });

    return res.json({
      msg: blocked ? "Community chat access blocked" : "Community chat access unblocked",
      user,
    });
  } catch (err) {
    console.error("Community block error:", err);
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};

const setDirectChatBlock = async (req, res) => {
  try {
    const blocked = Boolean(req.body?.blocked);
    const reason = String(req.body?.reason || "").trim();

    const user = await User.findOneAndUpdate(
      collegeScopedFilter(req, { _id: req.params.id, role: { $in: ["student", "alumni"] } }),
      {
        directChatBlocked: blocked,
        adminActionReason: reason,
      },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ msg: "User not found" });

    const io = req.app.get("io");
    await notifyUser({
      io,
      collegeId: req.user.collegeId,
      userId: user._id,
      type: "admin_action",
      title: blocked ? "Direct Chat Restricted" : "Direct Chat Restored",
      message: blocked
        ? "Admin restricted your direct/private chat access."
        : "Admin restored your direct/private chat access.",
      meta: {
        action: "direct_chat_access",
        blocked,
        reason,
      },
    });

    return res.json({
      msg: blocked ? "Direct chat access blocked" : "Direct chat access unblocked",
      user,
    });
  } catch (err) {
    console.error("Direct chat block error:", err);
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};

const removeDiscussion = async (req, res) => {
  try {
    const reason = String(req.body?.reason || "").trim();

    const discussion = await Discussion.findOneAndUpdate(
      {
        _id: req.params.id,
        collegeId: req.user.collegeId,
        isDeleted: false,
      },
      {
        isDeleted: true,
        moderationReason: reason || "Removed by admin",
        deletedByAdminId: req.user._id,
        deletedByAdminAt: new Date(),
      },
      { new: true }
    );

    if (!discussion) {
      return res.status(404).json({ msg: "Discussion not found" });
    }

    return res.json({
      success: true,
      msg: "Discussion removed successfully",
      discussion,
    });
  } catch (err) {
    console.error("Remove discussion error:", err);
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};

const listFeedbackForAdmin = async (req, res) => {
  try {
    const filter = { collegeId: req.user.collegeId };

    if (req.query.category) filter.category = req.query.category;
    if (req.query.status) filter.status = req.query.status;

    const feedbackItems = await Feedback.find(filter)
      .populate("userId", "name email role prn phone")
      .populate("handledBy", "name email")
      .sort({ createdAt: -1 });

    const searchRegex = buildSearchRegex(req.query.search);
    const items = searchRegex
      ? feedbackItems.filter((item) => {
          const byName = item.userId?.name || "";
          const byEmail = item.userId?.email || "";
          const byPrn = item.userId?.prn || "";
          const subject = item.subject || "";
          const message = item.message || "";
          return (
            searchRegex.test(byName) ||
            searchRegex.test(byEmail) ||
            searchRegex.test(byPrn) ||
            searchRegex.test(subject) ||
            searchRegex.test(message)
          );
        })
      : feedbackItems;

    return res.json({
      count: items.length,
      items,
    });
  } catch (err) {
    console.error("List feedback error:", err);
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};

const updateFeedbackStatus = async (req, res) => {
  try {
    const status = String(req.body?.status || "").trim();
    const adminResponse = String(req.body?.adminResponse || "").trim();
    const allowedStatus = ["open", "in_review", "resolved"];

    if (!allowedStatus.includes(status)) {
      return res.status(400).json({ msg: "Invalid status value" });
    }

    const feedback = await Feedback.findOneAndUpdate(
      {
        _id: req.params.id,
        collegeId: req.user.collegeId,
      },
      {
        status,
        adminResponse,
        handledBy: req.user._id,
      },
      { new: true }
    )
      .populate("userId", "name email role prn phone")
      .populate("handledBy", "name email");

    if (!feedback) return res.status(404).json({ msg: "Feedback not found" });

    return res.json({
      success: true,
      item: feedback,
    });
  } catch (err) {
    console.error("Update feedback status error:", err);
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};

const getAdminAnalytics = async (req, res) => {
  try {
    const collegeId = req.user.collegeId;

    const [
      totalStudents,
      totalAlumni,
      pendingVerification,
      totalBlocked,
      communityBlocked,
      directBlocked,
      eventCount,
      messageCount,
      discussionCount,
      openComplaints,
      mentorshipPending,
      recentUsers,
    ] = await Promise.all([
      User.countDocuments({ collegeId, role: "student" }),
      User.countDocuments({ collegeId, role: "alumni" }),
      User.countDocuments({ collegeId, role: { $in: ["student", "alumni"] }, verified: false }),
      User.countDocuments({ collegeId, role: { $in: ["student", "alumni"] }, blocked: true }),
      User.countDocuments({ collegeId, role: { $in: ["student", "alumni"] }, communityChatBlocked: true }),
      User.countDocuments({ collegeId, role: { $in: ["student", "alumni"] }, directChatBlocked: true }),
      Event.countDocuments({ collegeId }),
      Message.countDocuments({ collegeId }),
      Discussion.countDocuments({ collegeId, isDeleted: false }),
      Feedback.countDocuments({ collegeId, category: "complaint", status: { $ne: "resolved" } }),
      MentorshipRequest.countDocuments({ collegeId, status: "pending" }),
      User.find({ collegeId, role: { $in: ["student", "alumni"] } })
        .select("name email role prn createdAt lastLoginAt verified emailVerified")
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
    ]);

    return res.json({
      success: true,
      analytics: {
        totalStudents,
        totalAlumni,
        pendingVerification,
        totalBlocked,
        communityBlocked,
        directBlocked,
        eventCount,
        messageCount,
        discussionCount,
        openComplaints,
        mentorshipPending,
      },
      recentUsers,
    });
  } catch (err) {
    console.error("Admin analytics error:", err);
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};

module.exports = {
  verifyUser,
  listPendingUsers,
  listUsers,
  getAllStudents,
  getAllAlumni,
  blockUser,
  unblockUser,
  setCommunityChatBlock,
  setDirectChatBlock,
  removeDiscussion,
  listFeedbackForAdmin,
  updateFeedbackStatus,
  getAdminAnalytics,
};
