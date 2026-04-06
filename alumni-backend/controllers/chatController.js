const mongoose = require("mongoose");
const Message = require("../models/Message");
const User = require("../models/User");
const StudentProfile = require("../models/StudentProfile");
const ChatRequest = require("../models/ChatRequest");
const { canMessageDirectly } = require("../utils/chatPermission");
const { notifyUser } = require("../utils/notificationService");

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const MAX_MESSAGE_LENGTH = 2000;

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const sanitizeText = (text) => (typeof text === "string" ? text.trim() : "");
const escapeRegex = (value) => String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const parseLimit = (value) => {
  const num = Number.parseInt(value, 10);
  if (Number.isNaN(num) || num <= 0) return DEFAULT_LIMIT;
  return Math.min(num, MAX_LIMIT);
};

const parseRequestSort = (value) => (value === "oldest" ? { createdAt: 1 } : { createdAt: -1 });

const scoreStudentSearch = (user, profile, q) => {
  if (!q) return 1;

  const term = q.toLowerCase();
  const name = (user.name || "").toLowerCase();
  const email = (user.email || "").toLowerCase();
  const prn = (user.prn || "").toLowerCase();
  const branch = (profile?.branch || "").toLowerCase();
  const year = (profile?.yearOfStudy || "").toLowerCase();
  const skills = Array.isArray(profile?.skills) ? profile.skills.join(" ").toLowerCase() : "";

  let score = 0;

  if (prn === term) score += 120;
  if (prn.startsWith(term)) score += 70;
  if (prn.includes(term)) score += 40;

  if (name === term) score += 90;
  if (name.startsWith(term)) score += 60;
  if (name.includes(term)) score += 35;

  if (email.startsWith(term)) score += 20;
  if (email.includes(term)) score += 10;

  if (branch.includes(term)) score += 16;
  if (year.includes(term)) score += 10;
  if (skills.includes(term)) score += 8;

  return score;
};

const isUserOnline = (io, userId) => {
  if (!io) return false;
  const room = io.sockets.adapter.rooms.get(String(userId));
  return Boolean(room && room.size > 0);
};

const emitReadReceipt = (io, targetUserId, readerId) => {
  if (!io) return;
  io.to(String(targetUserId)).emit("chat:read", {
    readerId: String(readerId),
    readAt: new Date().toISOString(),
  });
};

const isAdminRole = (role) => ["admin", "collegeAdmin", "superAdmin"].includes(role);

const ensureDirectChatAccess = (req, res) => {
  if (!isAdminRole(req.user.role) && req.user.directChatBlocked) {
    res.status(403).json({ message: "Your direct chat access is blocked by admin" });
    return false;
  }
  return true;
};

exports.sendMessage = async (req, res) => {
  try {
    if (!ensureDirectChatAccess(req, res)) return;

    const { receiverId, text, clientId } = req.body || {};
    const cleanText = sanitizeText(text);

    if (!receiverId || !cleanText) {
      return res.status(400).json({ message: "receiverId and text are required" });
    }

    if (!isValidObjectId(receiverId)) {
      return res.status(400).json({ message: "Invalid receiverId format" });
    }

    if (String(receiverId) === String(req.user._id)) {
      return res.status(400).json({ message: "You cannot send a message to yourself" });
    }

    if (cleanText.length > MAX_MESSAGE_LENGTH) {
      return res.status(400).json({ message: `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters` });
    }

    const receiver = await User.findOne({
      _id: receiverId,
      collegeId: req.user.collegeId,
      blocked: false,
    }).select("_id role collegeId");

    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found in your college" });
    }

    const permission = await canMessageDirectly({
      collegeId: req.user.collegeId,
      senderUser: req.user,
      receiverUser: receiver,
    });

    if (!permission.allowed) {
      return res.status(403).json({ message: permission.reason || "Messaging is not allowed" });
    }

    const io = req.app.get("io");
    const receiverOnline = isUserOnline(io, receiverId);

    const newMessage = await Message.create({
      collegeId: req.user.collegeId,
      sender: req.user._id,
      receiver: receiverId,
      text: cleanText,
      status: receiverOnline ? "delivered" : "sent",
      deliveredAt: receiverOnline ? new Date() : undefined,
      clientId: clientId || undefined,
    });

    if (io) {
      io.to(String(receiverId)).emit("chat:new", newMessage);
      io.to(String(req.user._id)).emit("chat:sent", newMessage);
    }

    return res.status(201).json(newMessage);
  } catch (error) {
    console.error("sendMessage error:", error);
    return res.status(500).json({ message: "Failed to send message" });
  }
};

exports.getMessages = async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseLimit(req.query.limit);
    const q = sanitizeText(req.query.q);

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid userId format" });
    }

    const conversationUser = await User.findOne({
      _id: userId,
      collegeId: req.user.collegeId,
      blocked: false,
    }).select("_id");

    if (!conversationUser) {
      return res.status(404).json({ message: "Conversation user not found in your college" });
    }

    const query = {
      collegeId: req.user.collegeId,
      isDeleted: false,
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id },
      ],
    };

    if (q) {
      query.text = { $regex: escapeRegex(q), $options: "i" };
    }

    if (req.query.before) {
      const beforeDate = new Date(req.query.before);
      if (!Number.isNaN(beforeDate.getTime())) {
        query.createdAt = { $lt: beforeDate };
      }
    }

    const rawMessages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = rawMessages.length > limit;
    const pageMessages = hasMore ? rawMessages.slice(0, limit) : rawMessages;
    const messages = pageMessages.reverse();

    if (!q) {
      const readResult = await Message.updateMany(
        {
          collegeId: req.user.collegeId,
          sender: userId,
          receiver: req.user._id,
          status: { $ne: "read" },
          isDeleted: false,
        },
        {
          $set: {
            status: "read",
            readAt: new Date(),
          },
        }
      );

      if (readResult.modifiedCount > 0) {
        const io = req.app.get("io");
        emitReadReceipt(io, userId, req.user._id);
      }
    }

    return res.json({ messages, hasMore });
  } catch (error) {
    console.error("getMessages error:", error);
    return res.status(500).json({ message: "Failed to fetch messages" });
  }
};

exports.markConversationRead = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid userId format" });
    }

    const target = await User.findOne({
      _id: userId,
      collegeId: req.user.collegeId,
      blocked: false,
    }).select("_id");

    if (!target) {
      return res.status(404).json({ message: "User not found in your college" });
    }

    const result = await Message.updateMany(
      {
        collegeId: req.user.collegeId,
        sender: userId,
        receiver: req.user._id,
        status: { $ne: "read" },
        isDeleted: false,
      },
      {
        $set: {
          status: "read",
          readAt: new Date(),
        },
      }
    );

    const io = req.app.get("io");
    if (result.modifiedCount > 0) {
      emitReadReceipt(io, userId, req.user._id);
    }

    return res.json({
      success: true,
      updated: result.modifiedCount,
    });
  } catch (error) {
    console.error("markConversationRead error:", error);
    return res.status(500).json({ message: "Failed to mark conversation as read" });
  }
};

exports.getChatContacts = async (req, res) => {
  try {
    const userId = req.user._id;
    const q = sanitizeText(req.query.q);
    const queryRegex = q ? new RegExp(escapeRegex(q), "i") : null;

    const contactsAgg = await Message.aggregate([
      {
        $match: {
          collegeId: req.user.collegeId,
          isDeleted: false,
          $or: [{ sender: userId }, { receiver: userId }],
        },
      },
      {
        $project: {
          contactId: {
            $cond: [{ $eq: ["$sender", userId] }, "$receiver", "$sender"],
          },
          text: 1,
          createdAt: 1,
          status: 1,
        },
      },
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: "$contactId",
          lastMessage: { $first: "$text" },
          lastAt: { $first: "$createdAt" },
          lastStatus: { $first: "$status" },
        },
      },
      { $sort: { lastAt: -1 } },
    ]);

    const unreadAgg = await Message.aggregate([
      {
        $match: {
          collegeId: req.user.collegeId,
          receiver: userId,
          isDeleted: false,
          status: { $ne: "read" },
        },
      },
      {
        $group: {
          _id: "$sender",
          unreadCount: { $sum: 1 },
        },
      },
    ]);

    const unreadMap = new Map(unreadAgg.map((item) => [String(item._id), item.unreadCount]));
    const contactIds = contactsAgg.map((item) => item._id);

    const users = await User.find({
      _id: { $in: contactIds },
      collegeId: req.user.collegeId,
      blocked: false,
    }).select("name role prn email");

    const userMap = new Map(users.map((u) => [String(u._id), u]));
    const io = req.app.get("io");

    const contacts = contactsAgg
      .map((item) => {
        const contactUser = userMap.get(String(item._id));
        if (!contactUser) return null;

        const contactId = String(item._id);

        return {
          user: contactUser,
          lastMessage: item.lastMessage,
          lastAt: item.lastAt,
          lastStatus: item.lastStatus,
          unreadCount: unreadMap.get(contactId) || 0,
          isOnline: isUserOnline(io, contactId),
        };
      })
      .filter(Boolean)
      .filter((contact) => {
        if (!queryRegex) return true;
        const name = contact.user?.name || "";
        const email = contact.user?.email || "";
        const prn = contact.user?.prn || "";
        const lastMessage = contact.lastMessage || "";
        return (
          queryRegex.test(name) ||
          queryRegex.test(email) ||
          queryRegex.test(prn) ||
          queryRegex.test(lastMessage)
        );
      });

    return res.json({ contacts });
  } catch (error) {
    console.error("getChatContacts error:", error);
    return res.status(500).json({ message: "Failed to load chat contacts" });
  }
};

exports.createChatRequest = async (req, res) => {
  try {
    if (!ensureDirectChatAccess(req, res)) return;

    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Only students can send chat requests" });
    }

    const { receiverId } = req.params;
    const note = sanitizeText(req.body?.note || "");

    if (!isValidObjectId(receiverId)) {
      return res.status(400).json({ message: "Invalid receiverId format" });
    }

    if (String(receiverId) === String(req.user._id)) {
      return res.status(400).json({ message: "You cannot send request to yourself" });
    }

    const receiver = await User.findOne({
      _id: receiverId,
      collegeId: req.user.collegeId,
      role: "alumni",
      verified: true,
      blocked: false,
    }).select("_id name email prn role directChatBlocked");

    if (!receiver) {
      return res.status(404).json({ message: "Alumni not found in your college" });
    }

    if (receiver.directChatBlocked) {
      return res.status(403).json({ message: "This alumni user is not available for direct chat" });
    }

    const accepted = await ChatRequest.findOne({
      collegeId: req.user.collegeId,
      status: "accepted",
      $or: [
        { requester: req.user._id, receiver: receiver._id },
        { requester: receiver._id, receiver: req.user._id },
      ],
    }).select("_id");

    if (accepted) {
      return res.status(400).json({ message: "Chat request already accepted. You can message directly." });
    }

    const pendingOutgoing = await ChatRequest.findOne({
      collegeId: req.user.collegeId,
      requester: req.user._id,
      receiver: receiver._id,
      status: "pending",
    }).select("_id");

    if (pendingOutgoing) {
      return res.status(400).json({ message: "Chat request already sent and pending" });
    }

    const pendingIncoming = await ChatRequest.findOne({
      collegeId: req.user.collegeId,
      requester: receiver._id,
      receiver: req.user._id,
      status: "pending",
    }).select("_id");

    if (pendingIncoming) {
      return res.status(400).json({ message: "This alumni user already has your request pending." });
    }

    const request = await ChatRequest.create({
      collegeId: req.user.collegeId,
      requester: req.user._id,
      receiver: receiver._id,
      note: note.slice(0, 300) || undefined,
      status: "pending",
    });

    const populated = await ChatRequest.findById(request._id)
      .populate("requester", "name prn email role")
      .populate("receiver", "name prn email role");

    const io = req.app.get("io");
    if (io) {
      io.to(String(receiver._id)).emit("chat:request:new", { request: populated });
    }
    await notifyUser({
      io,
      collegeId: req.user.collegeId,
      userId: receiver._id,
      type: "chat_request",
      title: "New Chat Request",
      message: `${req.user.name} wants to message you directly.`,
      meta: { chatRequestId: request._id, requesterId: req.user._id },
    });

    return res.status(201).json({
      success: true,
      message: "Chat request sent",
      request: populated,
    });
  } catch (error) {
    console.error("createChatRequest error:", error);
    return res.status(500).json({ message: "Failed to send chat request" });
  }
};

exports.listMyChatRequests = async (req, res) => {
  try {
    if (!["student", "alumni"].includes(req.user.role)) {
      return res.status(403).json({ message: "Only students and alumni can access chat requests" });
    }

    const type = sanitizeText(req.query.type || "all");
    const status = sanitizeText(req.query.status || "");
    const q = sanitizeText(req.query.q || "");

    const filter = { collegeId: req.user.collegeId };
    if (type === "incoming") filter.receiver = req.user._id;
    else if (type === "outgoing") filter.requester = req.user._id;
    else {
      filter.$or = [{ requester: req.user._id }, { receiver: req.user._id }];
    }

    if (status && ["pending", "accepted", "rejected", "cancelled"].includes(status)) {
      filter.status = status;
    }

    let requests = await ChatRequest.find(filter)
      .populate("requester", "name prn email role")
      .populate("receiver", "name prn email role")
      .sort(parseRequestSort(req.query.sort));

    if (q) {
      const regex = new RegExp(escapeRegex(q), "i");
      requests = requests.filter((r) => {
        const requesterName = r.requester?.name || "";
        const requesterPrn = r.requester?.prn || "";
        const receiverName = r.receiver?.name || "";
        const receiverPrn = r.receiver?.prn || "";
        const note = r.note || "";
        return (
          regex.test(requesterName) ||
          regex.test(requesterPrn) ||
          regex.test(receiverName) ||
          regex.test(receiverPrn) ||
          regex.test(note)
        );
      });
    }

    return res.json({
      count: requests.length,
      requests,
    });
  } catch (error) {
    console.error("listMyChatRequests error:", error);
    return res.status(500).json({ message: "Failed to load chat requests" });
  }
};

exports.respondChatRequest = async (req, res) => {
  try {
    if (!ensureDirectChatAccess(req, res)) return;

    if (!["student", "alumni"].includes(req.user.role)) {
      return res.status(403).json({ message: "Only students and alumni can respond to chat requests" });
    }

    const { requestId } = req.params;
    const action = sanitizeText(req.body?.action || "").toLowerCase();

    if (!isValidObjectId(requestId)) {
      return res.status(400).json({ message: "Invalid requestId format" });
    }

    if (!["accepted", "rejected"].includes(action)) {
      return res.status(400).json({ message: "Action must be accepted or rejected" });
    }

    const request = await ChatRequest.findOne({
      _id: requestId,
      collegeId: req.user.collegeId,
      receiver: req.user._id,
      status: "pending",
    });

    if (!request) {
      return res.status(404).json({ message: "Pending chat request not found" });
    }

    request.status = action;
    request.respondedAt = new Date();
    await request.save();

    const populated = await ChatRequest.findById(request._id)
      .populate("requester", "name prn email role")
      .populate("receiver", "name prn email role");

    const io = req.app.get("io");
    if (io) {
      io.to(String(request.requester)).emit("chat:request:update", {
        request: populated,
      });
      io.to(String(request.receiver)).emit("chat:request:update", {
        request: populated,
      });
    }
    await notifyUser({
      io,
      collegeId: req.user.collegeId,
      userId: request.requester,
      type: "chat_request_update",
      title: "Chat Request Update",
      message:
        action === "accepted"
          ? `${req.user.name} accepted your chat request.`
          : `${req.user.name} rejected your chat request.`,
      meta: { chatRequestId: request._id, status: action },
    });

    return res.json({
      success: true,
      message: `Chat request ${action}`,
      request: populated,
    });
  } catch (error) {
    console.error("respondChatRequest error:", error);
    return res.status(500).json({ message: "Failed to respond to chat request" });
  }
};

exports.cancelChatRequest = async (req, res) => {
  try {
    if (!ensureDirectChatAccess(req, res)) return;

    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Only students can cancel chat requests" });
    }

    const { requestId } = req.params;
    if (!isValidObjectId(requestId)) {
      return res.status(400).json({ message: "Invalid requestId format" });
    }

    const request = await ChatRequest.findOne({
      _id: requestId,
      collegeId: req.user.collegeId,
      requester: req.user._id,
      status: "pending",
    });

    if (!request) {
      return res.status(404).json({ message: "Pending outgoing chat request not found" });
    }

    request.status = "cancelled";
    request.respondedAt = new Date();
    await request.save();

    const populated = await ChatRequest.findById(request._id)
      .populate("requester", "name prn email role")
      .populate("receiver", "name prn email role");

    const io = req.app.get("io");
    if (io) {
      io.to(String(request.requester)).emit("chat:request:update", { request: populated });
      io.to(String(request.receiver)).emit("chat:request:update", { request: populated });
    }

    await notifyUser({
      io,
      collegeId: req.user.collegeId,
      userId: request.receiver,
      type: "chat_request_update",
      title: "Chat Request Cancelled",
      message: `${req.user.name} cancelled the chat request.`,
      meta: { chatRequestId: request._id, status: "cancelled" },
    });

    return res.json({
      success: true,
      message: "Chat request cancelled",
      request: populated,
    });
  } catch (error) {
    console.error("cancelChatRequest error:", error);
    return res.status(500).json({ message: "Failed to cancel chat request" });
  }
};

exports.removeChatRequest = async (req, res) => {
  try {
    if (!["student", "alumni"].includes(req.user.role)) {
      return res.status(403).json({ message: "Only students and alumni can remove chat requests" });
    }

    const { requestId } = req.params;
    if (!isValidObjectId(requestId)) {
      return res.status(400).json({ message: "Invalid requestId format" });
    }

    const request = await ChatRequest.findOne({
      _id: requestId,
      collegeId: req.user.collegeId,
      $or: [{ requester: req.user._id }, { receiver: req.user._id }],
    });

    if (!request) {
      return res.status(404).json({ message: "Chat request not found" });
    }

    if (request.status === "accepted") {
      return res.status(400).json({ message: "Cannot remove accepted request. Chat is active." });
    }

    await ChatRequest.deleteOne({ _id: request._id });

    const io = req.app.get("io");
    if (io) {
      io.to(String(request.requester)).emit("chat:request:removed", {
        requestId: String(request._id),
      });
      io.to(String(request.receiver)).emit("chat:request:removed", {
        requestId: String(request._id),
      });
    }

    return res.json({
      success: true,
      message: "Chat request removed",
      requestId: String(request._id),
    });
  } catch (error) {
    console.error("removeChatRequest error:", error);
    return res.status(500).json({ message: "Failed to remove chat request" });
  }
};

exports.getChatRequestStatusWithUser = async (req, res) => {
  try {
    if (!["student", "alumni"].includes(req.user.role)) {
      return res.status(403).json({ message: "Only students and alumni can check chat request status" });
    }

    const { userId } = req.params;
    if (!isValidObjectId(userId)) {
      return res.status(400).json({ message: "Invalid userId format" });
    }

    if (String(userId) === String(req.user._id)) {
      return res.json({ status: "self", request: null });
    }

    const targetRole = req.user.role === "student" ? "alumni" : "student";
    const targetUser = await User.findOne({
      _id: userId,
      collegeId: req.user.collegeId,
      role: targetRole,
      verified: true,
      blocked: false,
    }).select("_id");

    if (!targetUser) {
      return res.status(404).json({ message: `${targetRole === "alumni" ? "Alumni" : "Student"} not found in your college` });
    }

    const accepted = await ChatRequest.findOne({
      collegeId: req.user.collegeId,
      status: "accepted",
      $or: [
        { requester: req.user._id, receiver: targetUser._id },
        { requester: targetUser._id, receiver: req.user._id },
      ],
    })
      .sort({ createdAt: -1 })
      .populate("requester", "name prn email role")
      .populate("receiver", "name prn email role");

    if (accepted) {
      return res.json({ status: "accepted", request: accepted });
    }

    const latest = await ChatRequest.findOne({
      collegeId: req.user.collegeId,
      $or: [
        { requester: req.user._id, receiver: targetUser._id },
        { requester: targetUser._id, receiver: req.user._id },
      ],
    })
      .sort({ createdAt: -1 })
      .populate("requester", "name prn email role")
      .populate("receiver", "name prn email role");

    if (!latest) {
      return res.json({ status: "none", request: null });
    }

    if (latest.status === "pending") {
      if (String(latest.requester?._id) === String(req.user._id)) {
        return res.json({ status: "pending_outgoing", request: latest });
      }
      return res.json({ status: "pending_incoming", request: latest });
    }

    return res.json({ status: latest.status, request: latest });
  } catch (error) {
    console.error("getChatRequestStatusWithUser error:", error);
    return res.status(500).json({ message: "Failed to get chat request status" });
  }
};

exports.searchStudentsForChat = async (req, res) => {
  try {
    if (req.user.role !== "student") {
      return res.status(403).json({ message: "Only students can search student chat directory" });
    }

    const q = sanitizeText(req.query.q);
    const limit = Math.min(Number.parseInt(req.query.limit || "20", 10) || 20, 50);
    const regex = q ? new RegExp(escapeRegex(q), "i") : null;

    const userQuery = {
      collegeId: req.user.collegeId,
      role: "student",
      blocked: false,
      verified: true,
      _id: { $ne: req.user._id },
    };

    if (regex) {
      userQuery.$or = [{ name: regex }, { email: regex }, { prn: regex }];
    }

    const candidates = await User.find(userQuery)
      .select("name email prn role collegeId")
      .limit(200)
      .lean();

    const candidateIds = candidates.map((u) => u._id);
    const profiles = await StudentProfile.find({
      user: { $in: candidateIds },
      collegeId: req.user.collegeId,
    })
      .select("user branch yearOfStudy graduationYear skills interests profileImage")
      .lean();

    const profileMap = new Map(profiles.map((p) => [String(p.user), p]));

    const ranked = candidates
      .map((u) => {
        const profile = profileMap.get(String(u._id)) || null;
        return {
          user: u,
          profile,
          score: scoreStudentSearch(u, profile, q),
        };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return String(a.user.name || "").localeCompare(String(b.user.name || ""));
      })
      .slice(0, limit);

    return res.json({
      count: ranked.length,
      students: ranked,
    });
  } catch (error) {
    console.error("searchStudentsForChat error:", error);
    return res.status(500).json({ message: "Failed to search students for chat" });
  }
};
