const mongoose = require("mongoose");

const feedbackSchema = new mongoose.Schema(
  {
    collegeId: { type: String, required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    subject: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Feedback", feedbackSchema);

