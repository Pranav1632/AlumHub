const express = require("express");
const router = express.Router();
const {
  createDiscussion,
  getAllDiscussions,
  getMyDiscussions,
} = require("../controllers/discussionController");
const { protect } = require("../middleware/authMiddleware");

router.post("/", protect, createDiscussion);
router.get("/", protect, getAllDiscussions);
router.get("/my", protect, getMyDiscussions);

module.exports = router;