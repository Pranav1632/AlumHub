const express = require("express");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const { createFeedback } = require("../controllers/feedbackController");

const router = express.Router();

router.post("/", protect, authorizeRoles("student", "alumni", "admin"), createFeedback);

module.exports = router;

