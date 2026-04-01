const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    collegeId: { type: String, required: true, index: true },
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: ["sent", "delivered", "read"],
      default: "sent",
      index: true,
    },
    deliveredAt: { type: Date },
    readAt: { type: Date },
    clientId: { type: String, trim: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

messageSchema.index({ collegeId: 1, sender: 1, receiver: 1, createdAt: -1 });
messageSchema.index({ collegeId: 1, receiver: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("Message", messageSchema);
