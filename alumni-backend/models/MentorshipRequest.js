const mongoose = require("mongoose");

const mentorshipRequestSchema = new mongoose.Schema(
  {
    adminId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    alumniId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "accepted", "rejected"],
      default: "pending",
    },
    acceptedAt: { type: Date },

    // 🔹 New fields for alumni acceptance
    acceptanceForm: {
      expertise: { type: String },
      availability: { type: String },
      mode: { type: String, enum: ["online", "offline", "hybrid"] },
    },
    termsAccepted: { type: Boolean, default: false },
     // Rejection
    rejectedAt: { type: Date },
    rejectionReason: { type: String },
  
  },
  
  { timestamps: true }
);

module.exports = mongoose.model("MentorshipRequest", mentorshipRequestSchema);
