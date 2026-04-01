const express = require("express");
const router = express.Router();
const {
  createDiscussion,
  getAllDiscussions,
  getMyDiscussions,
  toggleLike,
  toggleUpvote,
} = require("../controllers/discussionController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, createDiscussion);
router.get("/", protect, getAllDiscussions);
router.get("/my", protect, getMyDiscussions);
router.post("/:id/like", protect, toggleLike);
router.post("/:id/upvote", protect, toggleUpvote);

module.exports = router;
