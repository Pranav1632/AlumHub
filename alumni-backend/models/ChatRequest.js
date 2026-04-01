const mongoose = require("mongoose");

const chatRequestSchema = new mongoose.Schema(
  {
    collegeId: { type: String, required: true, index: true },
    requester: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "cancelled"],
      default: "pending",
      index: true,
    },
    note: { type: String, trim: true, maxlength: 300 },
    respondedAt: { type: Date },
  },
  { timestamps: true }
);

chatRequestSchema.index({ collegeId: 1, requester: 1, receiver: 1, createdAt: -1 });
chatRequestSchema.index({ collegeId: 1, receiver: 1, status: 1, createdAt: -1 });

module.exports = mongoose.model("ChatRequest", chatRequestSchema);

