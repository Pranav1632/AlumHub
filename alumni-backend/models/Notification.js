const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    collegeId: { type: String, required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: {
      type: String,
      enum: [
        "chat_request",
        "chat_request_update",
        "mentorship_request",
        "mentorship_update",
        "event_update",
        "discussion_reply",
        "discussion_reaction",
        "general",
      ],
      default: "general",
      index: true,
    },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    meta: { type: Object, default: {} },
    isRead: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

notificationSchema.index({ collegeId: 1, user: 1, createdAt: -1 });

module.exports = mongoose.model("Notification", notificationSchema);

