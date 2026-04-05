const Feedback = require("../models/Feedback");

const createFeedback = async (req, res) => {
  try {
    const subject = String(req.body?.subject || "").trim();
    const message = String(req.body?.message || "").trim();
    const category = String(req.body?.category || "feedback").trim().toLowerCase();

    const allowedCategories = ["feedback", "complaint", "suggestion", "bug_report"];

    if (!subject || !message) {
      return res.status(400).json({ message: "subject and message are required" });
    }

    if (!allowedCategories.includes(category)) {
      return res.status(400).json({ message: "Invalid feedback category" });
    }

    const feedback = await Feedback.create({
      collegeId: req.user.collegeId,
      userId: req.user._id,
      category,
      subject,
      message,
    });

    return res.status(201).json({
      success: true,
      message: "Feedback submitted successfully",
      feedback,
    });
  } catch (error) {
    console.error("Create feedback error:", error);
    return res.status(500).json({ message: "Failed to submit feedback" });
  }
};

module.exports = {
  createFeedback,
};
