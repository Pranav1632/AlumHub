const MentorshipRequest = require("../models/MentorshipRequest");
const User = require("../models/User");
const sendEmail = require("../utils/sendEmail");

const createMentorshipRequest = async (req, res) => {
  try {
    const { alumniId, studentId, message } = req.body;

    if (!alumniId || !message?.trim()) {
      return res.status(400).json({ msg: "alumniId and message are required" });
    }

    const requesterRole = req.user.role;

    const alumni = await User.findOne({
      _id: alumniId,
      role: "alumni",
      verified: true,
      blocked: false,
      collegeId: req.user.collegeId,
    });

    if (!alumni) {
      return res.status(400).json({ msg: "Invalid alumni for your college" });
    }

    let resolvedStudentId = null;
    let resolvedAdminId = null;

    if (requesterRole === "student") {
      resolvedStudentId = req.user._id;
    } else if (requesterRole === "admin") {
      resolvedAdminId = req.user._id;

      if (studentId) {
        const student = await User.findOne({
          _id: studentId,
          role: "student",
          collegeId: req.user.collegeId,
          blocked: false,
        });
        if (!student) {
          return res.status(400).json({ msg: "Invalid student for your college" });
        }
        resolvedStudentId = student._id;
      }
    } else {
      return res.status(403).json({ msg: "Only student/admin can create mentorship request" });
    }

    const mentorshipRequest = await MentorshipRequest.create({
      collegeId: req.user.collegeId,
      adminId: resolvedAdminId,
      studentId: resolvedStudentId,
      requestedBy: req.user._id,
      requestedByRole: requesterRole,
      alumniId,
      message: message.trim(),
    });

    try {
      await sendEmail({
        to: alumni.email,
        subject: "New Mentorship Request",
        text: `Hi ${alumni.name}, you received a new mentorship request: ${message}`,
      });
    } catch (emailErr) {
      console.error("Mentorship request email warning:", emailErr.message);
    }

    return res.status(201).json({
      success: true,
      msg: "Mentorship request sent",
      request: mentorshipRequest,
    });
  } catch (err) {
    console.error("Mentorship request error:", err);
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};

const acceptMentorshipRequest = async (req, res) => {
  try {
    const { expertise, availability, mode, termsAccepted } = req.body;

    if (!termsAccepted) {
      return res.status(400).json({ msg: "You must accept terms & conditions." });
    }

    const mentorshipRequest = await MentorshipRequest.findOne({
      _id: req.params.id,
      collegeId: req.user.collegeId,
    });

    if (!mentorshipRequest) return res.status(404).json({ msg: "Mentorship request not found" });

    if (String(mentorshipRequest.alumniId) !== String(req.user._id)) {
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

    return res.json({ success: true, msg: "Mentorship request accepted", request: mentorshipRequest });
  } catch (err) {
    console.error("Mentorship accept error:", err);
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};

const rejectMentorshipRequest = async (req, res) => {
  try {
    const { reason } = req.body;

    const mentorshipRequest = await MentorshipRequest.findOne({
      _id: req.params.id,
      collegeId: req.user.collegeId,
    });

    if (!mentorshipRequest) return res.status(404).json({ msg: "Mentorship request not found" });

    if (String(mentorshipRequest.alumniId) !== String(req.user._id)) {
      return res.status(403).json({ msg: "Not authorized for this request" });
    }

    if (mentorshipRequest.status !== "pending") {
      return res.status(400).json({ msg: `Request is already ${mentorshipRequest.status}` });
    }

    mentorshipRequest.status = "rejected";
    mentorshipRequest.rejectedAt = new Date();
    mentorshipRequest.rejectionReason = reason || "No reason provided";

    await mentorshipRequest.save();

    return res.json({ success: true, msg: "Mentorship request rejected", request: mentorshipRequest });
  } catch (err) {
    console.error("Mentorship reject error:", err);
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};

const listMyMentorshipRequests = async (req, res) => {
  try {
    const role = req.user.role;
    const filter = { collegeId: req.user.collegeId };

    if (role === "alumni") filter.alumniId = req.user._id;
    if (role === "admin") filter.adminId = req.user._id;
    if (role === "student") filter.studentId = req.user._id;

    const requests = await MentorshipRequest.find(filter)
      .populate("adminId", "name email")
      .populate("studentId", "name prn email")
      .populate("requestedBy", "name prn email role")
      .populate("alumniId", "name prn email")
      .sort({ createdAt: -1 });

    return res.json({ count: requests.length, requests });
  } catch (err) {
    console.error("Mentorship list error:", err);
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};

module.exports = {
  createMentorshipRequest,
  acceptMentorshipRequest,
  rejectMentorshipRequest,
  listMyMentorshipRequests,
};
