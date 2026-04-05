const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    collegeId: { type: String, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    category: {
      type: String,
      enum: ["feedback", "complaint", "suggestion", "bug_report"],
      default: "feedback",
      index: true,
    },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["open", "in_review", "resolved"],
      default: "open",
      index: true,
    },
    adminResponse: { type: String, default: "" },
    handledBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Feedback", feedbackSchema);
