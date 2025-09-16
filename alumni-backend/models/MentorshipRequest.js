const mongoose = require("mongoose");

const mentorshipRequestSchema = new mongoose.Schema({
  adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  alumniId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ["pending", "accepted", "rejected"], default: "pending" },
  acceptedAt: { type: Date },
}, { timestamps: true });

module.exports = mongoose.model("MentorshipRequest", mentorshipRequestSchema);
