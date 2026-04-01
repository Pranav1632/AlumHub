const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const Message = require("../models/Message");
const User = require("../models/User");
const { canMessageDirectly } = require("../utils/chatPermission");

const MAX_MESSAGE_LENGTH = 2000;
const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);

const activeConnections = new Map();

const incrementConnection = (userId) => {
  const key = String(userId);
  const current = activeConnections.get(key) || 0;
  activeConnections.set(key, current + 1);
  return current === 0;
};

const decrementConnection = (userId) => {
  const key = String(userId);
  const current = activeConnections.get(key) || 0;
  if (current <= 1) {
    activeConnections.delete(key);
    return true;
  }
  activeConnections.set(key, current - 1);
  return false;
};

const isUserOnline = (userId) => activeConnections.has(String(userId));

function chatSocket(io) {
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error("Unauthorized"));

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select("_id collegeId blocked role name");
      if (!user || user.blocked) return next(new Error("Unauthorized"));

      socket.user = user;
      return next();
    } catch (error) {
      console.error("Socket auth error:", error.message);
      return next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const userId = String(socket.user._id);
    const collegeRoom = `college:${socket.user.collegeId}`;

    socket.join(userId);
    socket.join(collegeRoom);

    const becameOnline = incrementConnection(userId);
    if (becameOnline) {
      io.to(collegeRoom).emit("presence:update", {
        userId,
        isOnline: true,
      });
    }

    (async () => {
      try {
        const pendingMessages = await Message.find({
          collegeId: socket.user.collegeId,
          receiver: socket.user._id,
          status: "sent",
          isDeleted: false,
        }).select("_id sender");

        if (!pendingMessages.length) return;

        const deliveredAt = new Date();
        const ids = pendingMessages.map((msg) => msg._id);

        await Message.updateMany(
          { _id: { $in: ids } },
          {
            $set: {
              status: "delivered",
              deliveredAt,
            },
          }
        );

        const senders = [...new Set(pendingMessages.map((msg) => String(msg.sender)))];
        senders.forEach((senderId) => {
          io.to(senderId).emit("chat:delivered", {
            receiverId: userId,
            deliveredAt: deliveredAt.toISOString(),
            messageIds: pendingMessages
              .filter((msg) => String(msg.sender) === senderId)
              .map((msg) => String(msg._id)),
          });
        });
      } catch (error) {
        console.error("Pending delivery reconcile error:", error.message);
      }
    })();

    socket.on("chat:send", async (payload = {}, ack) => {
      try {
        const { receiverId, text, clientId } = payload;
        const cleanText = typeof text === "string" ? text.trim() : "";

        if (!receiverId || !cleanText) {
          if (ack) ack({ ok: false, message: "receiverId and text are required" });
          return;
        }

        if (!isValidObjectId(receiverId)) {
          if (ack) ack({ ok: false, message: "Invalid receiverId" });
          return;
        }

        if (receiverId === userId) {
          if (ack) ack({ ok: false, message: "Cannot send message to yourself" });
          return;
        }

        if (cleanText.length > MAX_MESSAGE_LENGTH) {
          if (ack) ack({ ok: false, message: `Message cannot exceed ${MAX_MESSAGE_LENGTH} characters` });
          return;
        }

        const receiver = await User.findOne({
          _id: receiverId,
          collegeId: socket.user.collegeId,
          blocked: false,
        }).select("_id role collegeId");

        if (!receiver) {
          if (ack) ack({ ok: false, message: "Receiver unavailable" });
          return;
        }

        const permission = await canMessageDirectly({
          collegeId: socket.user.collegeId,
          senderUser: socket.user,
          receiverUser: receiver,
        });

        if (!permission.allowed) {
          if (ack) ack({ ok: false, message: permission.reason || "Messaging not allowed" });
          return;
        }

        const receiverOnline = isUserOnline(receiverId);
        const message = await Message.create({
          collegeId: socket.user.collegeId,
          sender: socket.user._id,
          receiver: receiverId,
          text: cleanText,
          status: receiverOnline ? "delivered" : "sent",
          deliveredAt: receiverOnline ? new Date() : undefined,
          clientId: clientId || undefined,
        });

        io.to(receiverId).emit("chat:new", message);
        io.to(userId).emit("chat:sent", message);

        if (ack) ack({ ok: true, message });
      } catch (error) {
        console.error("chat:send error:", error);
        if (ack) ack({ ok: false, message: "Message could not be sent" });
      }
    });

    socket.on("chat:typing", async (payload = {}) => {
      try {
        const { receiverId, isTyping = false } = payload;
        if (!receiverId || !isValidObjectId(receiverId)) return;

        const receiver = await User.findOne({
          _id: receiverId,
          collegeId: socket.user.collegeId,
          blocked: false,
        }).select("_id");

        if (!receiver) return;

        io.to(String(receiverId)).emit("chat:typing", {
          fromUserId: userId,
          isTyping: Boolean(isTyping),
        });
      } catch (error) {
        console.error("chat:typing error:", error.message);
      }
    });

    socket.on("chat:read", async (payload = {}) => {
      try {
        const { userId: otherUserId } = payload;
        if (!otherUserId || !isValidObjectId(otherUserId)) return;

        const targetUser = await User.findOne({
          _id: otherUserId,
          collegeId: socket.user.collegeId,
          blocked: false,
        }).select("_id");

        if (!targetUser) return;

        const readAt = new Date();
        const result = await Message.updateMany(
          {
            collegeId: socket.user.collegeId,
            sender: otherUserId,
            receiver: socket.user._id,
            status: { $ne: "read" },
            isDeleted: false,
          },
          {
            $set: {
              status: "read",
              readAt,
            },
          }
        );

        if (result.modifiedCount > 0) {
          io.to(String(otherUserId)).emit("chat:read", {
            readerId: userId,
            readAt: readAt.toISOString(),
          });
        }
      } catch (error) {
        console.error("chat:read error:", error.message);
      }
    });

    socket.on("disconnect", () => {
      try {
        const becameOffline = decrementConnection(userId);
        if (becameOffline) {
          io.to(collegeRoom).emit("presence:update", {
            userId,
            isOnline: false,
          });
        }
      } catch (error) {
        console.error("socket disconnect error:", error.message);
      }
    });
  });
}

module.exports = chatSocket;
