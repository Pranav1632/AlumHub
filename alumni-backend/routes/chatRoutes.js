const express = require("express");
const {
  sendMessage,
  getMessages,
  getChatContacts,
  markConversationRead,
  searchStudentsForChat,
  createChatRequest,
  listMyChatRequests,
  respondChatRequest,
  cancelChatRequest,
  removeChatRequest,
  getChatRequestStatusWithUser,
} = require("../controllers/chatController");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/", protect, sendMessage);
router.get("/contacts", protect, getChatContacts);
router.get("/students/search", protect, authorizeRoles("student"), searchStudentsForChat);
router.get("/requests", protect, authorizeRoles("student", "alumni"), listMyChatRequests);
router.post("/request/:receiverId", protect, authorizeRoles("student"), createChatRequest);
router.post("/request/:requestId/respond", protect, authorizeRoles("student", "alumni"), respondChatRequest);
router.post("/request/:requestId/cancel", protect, authorizeRoles("student"), cancelChatRequest);
router.delete("/request/:requestId", protect, authorizeRoles("student", "alumni"), removeChatRequest);
router.get("/request/status/:userId", protect, authorizeRoles("student", "alumni"), getChatRequestStatusWithUser);
router.patch("/read/:userId", protect, markConversationRead);
router.get("/:userId", protect, getMessages);

module.exports = router;
