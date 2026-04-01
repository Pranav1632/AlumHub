const Notification = require("../models/Notification");

const parseLimit = (value) => {
  const parsed = Number.parseInt(value, 10);
  if (Number.isNaN(parsed) || parsed <= 0) return 25;
  return Math.min(parsed, 100);
};

exports.listNotifications = async (req, res) => {
  try {
    const limit = parseLimit(req.query.limit);
    const page = Math.max(Number.parseInt(req.query.page || "1", 10) || 1, 1);
    const skip = (page - 1) * limit;

    const filter = {
      collegeId: req.user.collegeId,
      user: req.user._id,
    };

    if (req.query.unread === "true") {
      filter.isRead = false;
    }

    const [items, unreadCount, total] = await Promise.all([
      Notification.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments({
        collegeId: req.user.collegeId,
        user: req.user._id,
        isRead: false,
      }),
      Notification.countDocuments(filter),
    ]);

    return res.json({
      page,
      limit,
      total,
      unreadCount,
      items,
    });
  } catch (error) {
    console.error("listNotifications error:", error);
    return res.status(500).json({ message: "Failed to load notifications" });
  }
};

exports.markNotificationRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      {
        _id: req.params.id,
        collegeId: req.user.collegeId,
        user: req.user._id,
      },
      { $set: { isRead: true } },
      { new: true }
    ).lean();

    if (!notification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    return res.json({ success: true, item: notification });
  } catch (error) {
    console.error("markNotificationRead error:", error);
    return res.status(500).json({ message: "Failed to mark notification as read" });
  }
};

exports.markAllNotificationsRead = async (req, res) => {
  try {
    const result = await Notification.updateMany(
      {
        collegeId: req.user.collegeId,
        user: req.user._id,
        isRead: false,
      },
      { $set: { isRead: true } }
    );

    return res.json({
      success: true,
      updated: result.modifiedCount || 0,
    });
  } catch (error) {
    console.error("markAllNotificationsRead error:", error);
    return res.status(500).json({ message: "Failed to mark all notifications as read" });
  }
};

