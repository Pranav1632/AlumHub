const express = require("express");
const {
  sendMessage,
  getMessages,
  getChatContacts,
  markConversationRead,
} = require("../controllers/chatController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, sendMessage);
router.get("/contacts", protect, getChatContacts);
router.patch("/read/:userId", protect, markConversationRead);
router.get("/:userId", protect, getMessages);

module.exports = router;
