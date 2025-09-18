const express = require("express");
const router = express.Router();
const { createDiscussion, getAllDiscussions, getMyDiscussions } = require("../controllers/discussionController");
const { protect } = require("../middleware/authMiddleware");

// Routes
router.post("/", protect, createDiscussion);       // Create post
router.get("/", getAllDiscussions);                // Public: see all posts
router.get("/my", protect, getMyDiscussions);      // User’s own posts

module.exports = router;
