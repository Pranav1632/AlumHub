const express = require("express");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const { createMentorshipRequest } = require("../controllers/mentorshipController");

const router = express.Router();

// Admin sends mentorship request
router.post("/request", protect, authorizeRoles("collegeAdmin"), createMentorshipRequest);

module.exports = router;
