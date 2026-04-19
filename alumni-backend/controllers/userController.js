const User = require("../models/User");
const StudentProfile = require("../models/StudentProfile");
const AlumniProfile = require("../models/AlumniProfile");
const Message = require("../models/Message");
const { getProfileCompletion } = require("../utils/profileCompletion");

const escapeRegex = (value) => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const normalizeText = (value) => String(value || "").trim();
const normalizeList = (value) =>
  Array.isArray(value)
    ? value.map((item) => normalizeText(item)).filter(Boolean)
    : [];
const hasListValue = (value) => Array.isArray(value) && value.some((item) => normalizeText(item));

const isValidPdfUrl = (value) => {
  const text = normalizeText(value);
  if (!text) return false;

  let parsedUrl;
  try {
    parsedUrl = new URL(text);
  } catch {
    return false;
  }

  if (!["http:", "https:"].includes(parsedUrl.protocol)) return false;
  return String(parsedUrl.pathname || "").toLowerCase().endsWith(".pdf");
};

const getProfileModelByRole = (role) => {
  if (role === "student") return StudentProfile;
  if (role === "alumni") return AlumniProfile;
  return null;
};

const getCompletionPayload = ({ role, user, profile }) => {
  if (!["student", "alumni"].includes(role)) {
    return {
      role,
      completionPercent: 100,
      isComplete: true,
      missingFields: [],
    };
  }
  return getProfileCompletion({ user, profile });
};

const getProfileValidationError = ({ role, name, email, phone, body }) => {
  if (!name || !email || !phone) {
    return "Name, email and phone are required";
  }

  const requiredCommon = ["branch", "graduationYear", "headline", "bio", "location", "linkedIn", "github", "portfolio"];
  const missingCommon = requiredCommon.filter((field) => !normalizeText(body?.[field]));
  if (missingCommon.length > 0) {
    return "Complete all required fields: branch, graduation year, headline, bio, location, LinkedIn, GitHub and portfolio";
  }

  if (!hasListValue(body?.skills) || !hasListValue(body?.interests) || !hasListValue(body?.achievements)) {
    return "Skills, interests and achievements are required";
  }

  const resumeLink = normalizeText(body?.resumeLink);
  const lastYearFeeReceiptUrl = normalizeText(body?.lastYearFeeReceiptUrl);
  const recentFeeReceiptUrl = normalizeText(body?.recentFeeReceiptUrl);
  const studentIdCardUrl = normalizeText(body?.studentIdCardUrl);

  if (resumeLink && !isValidPdfUrl(resumeLink)) {
    return "Resume must be a valid PDF URL";
  }

  if (role === "student") {
    if (!normalizeText(body?.yearOfStudy)) {
      return "Year Of Study is required for student profile";
    }

    if (!recentFeeReceiptUrl && !studentIdCardUrl) {
      return "Upload Recent Fee Receipt PDF or Student ID Card PDF";
    }

    if ((recentFeeReceiptUrl && !isValidPdfUrl(recentFeeReceiptUrl)) || (studentIdCardUrl && !isValidPdfUrl(studentIdCardUrl))) {
      return "Student verification documents must be valid PDF URLs";
    }
  }

  if (role === "alumni") {
    if (!normalizeText(body?.currentCompany) || !normalizeText(body?.jobTitle)) {
      return "Current company and job title are required for alumni profile";
    }

    if (!resumeLink && !lastYearFeeReceiptUrl) {
      return "Upload Resume PDF or Last Year Fee Receipt PDF";
    }

    if (lastYearFeeReceiptUrl && !isValidPdfUrl(lastYearFeeReceiptUrl)) {
      return "Last year fee receipt must be a valid PDF URL";
    }
  }

  return null;
};

const roleWeight = (role) => {
  if (role === "admin" || role === "collegeAdmin" || role === "superAdmin") return 18;
  if (role === "alumni") return 14;
  if (role === "student") return 10;
  return 5;
};

const scoreUserResult = (user, query) => {
  if (!query) return roleWeight(user.role) + 5;

  const q = query.toLowerCase();
  const name = String(user.name || "").toLowerCase();
  const email = String(user.email || "").toLowerCase();
  const prn = String(user.prn || "").toLowerCase();
  const instituteCode = String(user.instituteCode || "").toLowerCase();
  const role = String(user.role || "").toLowerCase();

  let score = roleWeight(user.role);

  if (name === q) score += 80;
  if (name.startsWith(q)) score += 55;
  if (name.includes(q)) score += 32;

  if (prn === q || instituteCode === q) score += 70;
  if (prn.startsWith(q) || instituteCode.startsWith(q)) score += 42;
  if (prn.includes(q) || instituteCode.includes(q)) score += 24;

  if (email.startsWith(q)) score += 20;
  if (email.includes(q)) score += 10;

  if (role.includes(q)) score += 8;

  return score;
};

const scoreChatResult = (item, query, user) => {
  const now = Date.now();
  const lastAtMs = item.lastAt ? new Date(item.lastAt).getTime() : 0;
  const ageInDays = lastAtMs > 0 ? Math.floor((now - lastAtMs) / (24 * 60 * 60 * 1000)) : 999;
  const recencyScore = Math.max(0, 30 - ageInDays);

  if (!query) return recencyScore + 10;

  const q = query.toLowerCase();
  const message = String(item.lastMessage || "").toLowerCase();
  const name = String(user?.name || "").toLowerCase();
  const email = String(user?.email || "").toLowerCase();
  const prn = String(user?.prn || "").toLowerCase();

  let score = recencyScore;
  if (message.includes(q)) score += 32;
  if (name.startsWith(q)) score += 28;
  if (name.includes(q)) score += 16;
  if (email.includes(q)) score += 10;
  if (prn.includes(q)) score += 10;

  return score;
};

exports.getMe = async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.user.id, collegeId: req.user.collegeId }).select("-password");
    if (!user) return res.status(404).json({ message: "User not found" });

    const Model = getProfileModelByRole(user.role);
    const profile = Model
      ? await Model.findOne({ user: req.user.id, collegeId: req.user.collegeId })
      : null;
    const profileCompletion = getCompletionPayload({ role: user.role, user, profile });

    return res.json({ user, profile, profileCompletion });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Server Error" });
  }
};

exports.updateMe = async (req, res) => {
  try {
    const userId = req.user.id;
    const nextName = normalizeText(req.body?.name);
    const nextEmail = normalizeText(req.body?.email).toLowerCase();
    const nextPhone = normalizeText(req.body?.phone);

    const role = req.user.role;
    if (["student", "alumni"].includes(role)) {
      const profileValidationError = getProfileValidationError({
        role,
        name: nextName,
        email: nextEmail,
        phone: nextPhone,
        body: req.body,
      });

      if (profileValidationError) {
        return res.status(400).json({ message: profileValidationError });
      }
    } else if (!nextName || !nextEmail || !nextPhone) {
      return res.status(400).json({ message: "Name, email and phone are required" });
    }

    const updatedUser = await User.findOneAndUpdate(
      { _id: userId, collegeId: req.user.collegeId },
      { name: nextName, email: nextEmail, phone: nextPhone || req.user.phone || "" },
      { new: true }
    ).select("-password");

    if (!updatedUser) return res.status(404).json({ message: "User not found" });

    let profile = null;
    const profilePayload = {
      collegeId: req.user.collegeId,
      phone: nextPhone || req.user.phone || "",
      branch: normalizeText(req.body?.branch),
      graduationYear: normalizeText(req.body?.graduationYear),
      profileImage: normalizeText(req.body?.profileImage),
      bio: normalizeText(req.body?.bio),
      headline: normalizeText(req.body?.headline),
      location: normalizeText(req.body?.location),
      skills: normalizeList(req.body?.skills),
      interests: normalizeList(req.body?.interests),
      achievements: normalizeList(req.body?.achievements),
      linkedIn: normalizeText(req.body?.linkedIn),
      github: normalizeText(req.body?.github),
      portfolio: normalizeText(req.body?.portfolio),
      resumeLink: normalizeText(req.body?.resumeLink),
    };

    if (updatedUser.role === "student") {
      profile = await StudentProfile.findOneAndUpdate(
        { user: userId, collegeId: req.user.collegeId },
        {
          $set: {
            ...profilePayload,
            yearOfStudy: normalizeText(req.body?.yearOfStudy),
            recentFeeReceiptUrl: normalizeText(req.body?.recentFeeReceiptUrl),
            studentIdCardUrl: normalizeText(req.body?.studentIdCardUrl),
          },
        },
        { new: true, upsert: true }
      );
    } else if (updatedUser.role === "alumni") {
      profile = await AlumniProfile.findOneAndUpdate(
        { user: userId, collegeId: req.user.collegeId },
        {
          $set: {
            ...profilePayload,
            currentCompany: normalizeText(req.body?.currentCompany),
            jobTitle: normalizeText(req.body?.jobTitle),
            lastYearFeeReceiptUrl: normalizeText(req.body?.lastYearFeeReceiptUrl),
          },
        },
        { new: true, upsert: true }
      );
    }

    const profileCompletion = getCompletionPayload({
      role: updatedUser.role,
      user: updatedUser,
      profile,
    });

    return res.json({ user: updatedUser, profile, profileCompletion });
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

exports.globalSearch = async (req, res) => {
  try {
    const meId = req.user._id || req.user.id;
    const query = String(req.query?.q || "").trim();
    const limitRaw = Number.parseInt(String(req.query?.limit || "8"), 10);
    const limit = Number.isNaN(limitRaw) ? 8 : Math.min(Math.max(limitRaw, 1), 20);
    const regex = query ? new RegExp(escapeRegex(query), "i") : null;

    const userFilter = {
      collegeId: req.user.collegeId,
      blocked: false,
      _id: { $ne: meId },
      $or: [{ role: { $in: ["admin", "collegeAdmin", "superAdmin"] } }, { verified: true }],
    };

    if (regex) {
      userFilter.$and = [
        {
          $or: [
            { name: regex },
            { email: regex },
            { prn: regex },
            { instituteCode: regex },
            { role: regex },
          ],
        },
      ];
    }

    const users = await User.find(userFilter)
      .select("name email prn instituteCode role verified")
      .limit(120)
      .lean();

    const rankedUsers = users
      .map((user) => ({
        ...user,
        searchScore: scoreUserResult(user, query),
      }))
      .filter((user) => user.searchScore > 0)
      .sort((a, b) => {
        if (b.searchScore !== a.searchScore) return b.searchScore - a.searchScore;
        return String(a.name || "").localeCompare(String(b.name || ""));
      })
      .slice(0, limit)
      .map(({ searchScore, ...user }) => user);

    const myConversations = await Message.aggregate([
      {
        $match: {
          collegeId: req.user.collegeId,
          isDeleted: false,
          $or: [{ sender: meId }, { receiver: meId }],
        },
      },
      {
        $project: {
          peerId: {
            $cond: [{ $eq: ["$sender", meId] }, "$receiver", "$sender"],
          },
          text: 1,
          createdAt: 1,
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$peerId",
          lastMessage: { $first: "$text" },
          lastAt: { $first: "$createdAt" },
        },
      },
      { $sort: { lastAt: -1 } },
      { $limit: 120 },
    ]);

    const chatPeerIds = myConversations.map((item) => item._id).filter(Boolean);
    const chatPeers = await User.find({
      _id: { $in: chatPeerIds },
      collegeId: req.user.collegeId,
      blocked: false,
      $or: [{ role: { $in: ["admin", "collegeAdmin", "superAdmin"] } }, { verified: true }],
    })
      .select("name email prn role")
      .lean();

    const userMap = new Map(chatPeers.map((user) => [String(user._id), user]));

    const rankedChats = myConversations
      .map((item) => {
        const peer = userMap.get(String(item._id));
        if (!peer) return null;

        const searchScore = scoreChatResult(item, query, peer);
        if (searchScore <= 0) return null;

        if (query) {
          const message = String(item.lastMessage || "").toLowerCase();
          const peerText = `${peer.name || ""} ${peer.email || ""} ${peer.prn || ""}`.toLowerCase();
          if (!message.includes(query.toLowerCase()) && !peerText.includes(query.toLowerCase())) {
            return null;
          }
        }

        return {
          user: {
            _id: peer._id,
            name: peer.name,
            email: peer.email,
            prn: peer.prn,
            role: peer.role,
          },
          lastMessage: item.lastMessage || "",
          lastAt: item.lastAt,
          searchScore,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (b.searchScore !== a.searchScore) return b.searchScore - a.searchScore;
        return new Date(b.lastAt || 0).getTime() - new Date(a.lastAt || 0).getTime();
      })
      .slice(0, limit)
      .map(({ searchScore, ...chat }) => chat);

    return res.json({
      success: true,
      query,
      users: rankedUsers,
      chats: rankedChats,
    });
  } catch (err) {
    console.error("globalSearch error:", err);
    return res.status(500).json({ message: "Failed to search directory" });
  }
};
