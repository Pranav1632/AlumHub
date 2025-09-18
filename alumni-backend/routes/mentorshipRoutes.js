const express = require("express");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const {
  createMentorshipRequest,
  acceptMentorshipRequest,
  rejectMentorshipRequest,
} = require("../controllers/mentorshipController");

const router = express.Router();

// Admin sends mentorship request
router.post("/request", protect, authorizeRoles("collegeAdmin"), createMentorshipRequest);

// Alumni accepts mentorship request
router.post("/:id/accept", protect, authorizeRoles("alumni"), acceptMentorshipRequest);

// Alumni rejects mentorship request
router.post("/:id/reject", protect, authorizeRoles("alumni"), rejectMentorshipRequest);

module.exports = router;
