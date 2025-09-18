const express = require("express");
const { sendMessage, getMessages } = require("../controllers/chatController");
const { protect } = require("../middleware/authMiddleware");
const router = express.Router();

router.post("/", protect, sendMessage);   // Send message
router.get("/:userId", protect, getMessages); // Fetch conversation

module.exports = router;
