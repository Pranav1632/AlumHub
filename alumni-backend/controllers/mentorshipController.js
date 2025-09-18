const MentorshipRequest = require("../models/MentorshipRequest");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail"); // assumes you already have email util

/**
 * Admin triggers mentorship request to alumni
 */
const createMentorshipRequest = async (req, res) => {
  try {
    const { alumniId, message } = req.body;

    // Validate alumni
    const alumni = await User.findById(alumniId);
    if (!alumni || alumni.role !== "alumni" || !alumni.verified) {
      return res.status(400).json({ msg: "Invalid alumni" });
    }

    // Save request in DB
    const mentorshipRequest = await MentorshipRequest.create({
      adminId: req.user._id, // logged in admin
      alumniId,
      message,
    });

    // Send Email to Alumni
    const emailSubject = "New Mentorship Request";
    const emailMessage = `
      Dear ${alumni.name},

      You have received a new mentorship request from Admin PRN: ${req.user.prn}.
      Message: ${message}

      Please login and check the Mentorship Requests section.
    `;

    await sendEmail({
      to: alumni.email,
      subject: emailSubject,
      text: emailMessage,
    });

    res.status(201).json({
      success: true,
      msg: "Mentorship request sent to alumni",
      request: mentorshipRequest,
    });
  } catch (err) {
    console.error("Mentorship request error:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
  };
  /**
 * Alumni accepts mentorship request
 */
const acceptMentorshipRequest = async (req, res) => {
  try {
    const { expertise, availability, mode, termsAccepted } = req.body;

    if (!termsAccepted) {
      return res.status(400).json({ msg: "You must accept terms & conditions." });
    }

    const mentorshipRequest = await MentorshipRequest.findById(req.params.id);

    if (!mentorshipRequest) {
      return res.status(404).json({ msg: "Mentorship request not found" });
    }

    if (mentorshipRequest.alumniId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: "Not authorized for this request" });
    }

    if (mentorshipRequest.status !== "pending") {
      return res.status(400).json({ msg: `Request is already ${mentorshipRequest.status}` });
    }

    mentorshipRequest.status = "accepted";
    mentorshipRequest.acceptedAt = new Date();
    mentorshipRequest.acceptanceForm = { expertise, availability, mode };
    mentorshipRequest.termsAccepted = true;

    await mentorshipRequest.save();

    res.json({
      success: true,
      msg: "Mentorship request accepted successfully",
      request: mentorshipRequest,
    });
  } catch (err) {
    console.error("Mentorship accept error:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }};
  /**
 * Alumni rejects mentorship request
 */
const rejectMentorshipRequest = async (req, res) => {
  try {
    const { reason } = req.body;

    const mentorshipRequest = await MentorshipRequest.findById(req.params.id);

    if (!mentorshipRequest) {
      return res.status(404).json({ msg: "Mentorship request not found" });
    }

    if (mentorshipRequest.alumniId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ msg: "Not authorized for this request" });
    }

    if (mentorshipRequest.status !== "pending") {
      return res
        .status(400)
        .json({ msg: `Request is already ${mentorshipRequest.status}` });
    }

    mentorshipRequest.status = "rejected";
    mentorshipRequest.rejectedAt = new Date();
    mentorshipRequest.rejectionReason = reason || "No reason provided";

    await mentorshipRequest.save();

    res.json({
      success: true,
      msg: "Mentorship request rejected successfully",
      request: mentorshipRequest,
    });
  } catch (err) {
    console.error("Mentorship reject error:", err);
    res.status(500).json({ msg: "Server error", error: err.message });
  }
};

module.exports = {
  createMentorshipRequest,
  acceptMentorshipRequest,
  rejectMentorshipRequest,
};