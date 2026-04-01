const express = require("express");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const {
  createMentorshipRequest,
  acceptMentorshipRequest,
  rejectMentorshipRequest,
  listMyMentorshipRequests,
} = require("../controllers/mentorshipController");

const router = express.Router();

router.post("/request", protect, authorizeRoles("admin", "student"), createMentorshipRequest);
router.post("/:id/accept", protect, authorizeRoles("alumni"), acceptMentorshipRequest);
router.post("/:id/reject", protect, authorizeRoles("alumni"), rejectMentorshipRequest);
router.get("/my", protect, authorizeRoles("admin", "alumni", "student"), listMyMentorshipRequests);

module.exports = router;
