const mongoose = require("mongoose");

const mentorshipRequestSchema = new mongoose.Schema(
  {
    collegeId: { type: String, required: true, index: true },
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    requestedByRole: {
      type: String,
      enum: ["student", "admin"],
      default: null,
    },
    alumniId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected", "completed"],
      default: "pending",
    },
    acceptedAt: { type: Date },
    completedAt: { type: Date },
    acceptanceForm: {
      expertise: { type: String },
      availability: { type: String },
      mode: { type: String, enum: ["online", "offline", "hybrid"] },
    },
    termsAccepted: { type: Boolean, default: false },
    rejectedAt: { type: Date },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model("MentorshipRequest", mentorshipRequestSchema);
