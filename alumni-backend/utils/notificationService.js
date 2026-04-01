const Notification = require("../models/Notification");
const User = require("../models/User");

const emitNotification = (io, userId, notification) => {
  if (!io || !userId || !notification) return;
  io.to(String(userId)).emit("notification:new", { notification });
};

const notifyUser = async ({
  io,
  collegeId,
  userId,
  type = "general",
  title,
  message,
  meta = {},
}) => {
  if (!collegeId || !userId || !title || !message) return null;

  const notification = await Notification.create({
    collegeId,
    user: userId,
    type,
    title,
    message,
    meta,
  });

  emitNotification(io, userId, notification);
  return notification;
};

const notifyUsers = async ({
  io,
  collegeId,
  userIds = [],
  type = "general",
  title,
  message,
  meta = {},
}) => {
  if (!collegeId || !title || !message || !Array.isArray(userIds) || userIds.length === 0) {
    return [];
  }

  const uniqueIds = [...new Set(userIds.map((id) => String(id)).filter(Boolean))];
  if (uniqueIds.length === 0) return [];

  const docs = uniqueIds.map((userId) => ({
    collegeId,
    user: userId,
    type,
    title,
    message,
    meta,
  }));

  const created = await Notification.insertMany(docs);
  created.forEach((notification) => {
    emitNotification(io, notification.user, notification);
  });
  return created;
};

const getCollegeAudienceIds = async ({ collegeId, excludeUserId = null }) => {
  const query = {
    collegeId,
    blocked: false,
    $or: [{ role: { $in: ["admin", "collegeAdmin", "superAdmin"] } }, { verified: true }],
  };

  if (excludeUserId) {
    query._id = { $ne: excludeUserId };
  }

  const users = await User.find(query).select("_id");
  return users.map((u) => String(u._id));
};

module.exports = {
  notifyUser,
  notifyUsers,
  getCollegeAudienceIds,
};

