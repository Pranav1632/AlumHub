const mongoose = require("mongoose");
const Message = require("../models/Message");
const User = require("../models/User");

const DEFAULT_LIMIT = 50;
const MAX_LIMIT = 100;
const MAX_MESSAGE_LENGTH = 2000;

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const sanitizeText = (text) => (typeof text === "string" ? text.trim() : "");

const parseLimit = (value) => {
  const num = Number.parseInt(value, 10);
  if (Number.isNaN(num) || num <= 0) return DEFAULT_LIMIT;
  return Math.min(num, MAX_LIMIT);
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

exports.sendMessage = async (req, res) => {
  try {
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
    }).select("_id");

    if (!receiver) {
      return res.status(404).json({ message: "Receiver not found in your college" });
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
      .filter(Boolean);

    return res.json({ contacts });
  } catch (error) {
    console.error("getChatContacts error:", error);
    return res.status(500).json({ message: "Failed to load chat contacts" });
  }
};