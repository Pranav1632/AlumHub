const express = require("express");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const {
  verifyUser,
  listPendingUsers,
  listUsers,
  getAllStudents,
  getAllAlumni,
  blockUser,
  unblockUser,
  setCommunityChatBlock,
  setDirectChatBlock,
  removeDiscussion,
  listFeedbackForAdmin,
  updateFeedbackStatus,
  getAdminAnalytics,
} = require("../controllers/adminController");

const router = express.Router();

router.put("/verify/:id", protect, authorizeRoles("admin"), verifyUser);
router.get("/pending", protect, authorizeRoles("admin"), listPendingUsers);
router.get("/users", protect, authorizeRoles("admin"), listUsers);
router.get("/students", protect, authorizeRoles("admin"), getAllStudents);
router.get("/alumni", protect, authorizeRoles("admin"), getAllAlumni);
router.put("/block/:id", protect, authorizeRoles("admin"), blockUser);
router.put("/unblock/:id", protect, authorizeRoles("admin"), unblockUser);
router.patch("/community-access/:id", protect, authorizeRoles("admin"), setCommunityChatBlock);
router.patch("/direct-chat-access/:id", protect, authorizeRoles("admin"), setDirectChatBlock);
router.delete("/discussion/:id", protect, authorizeRoles("admin"), removeDiscussion);
router.get("/feedback", protect, authorizeRoles("admin"), listFeedbackForAdmin);
router.patch("/feedback/:id/status", protect, authorizeRoles("admin"), updateFeedbackStatus);
router.get("/analytics", protect, authorizeRoles("admin"), getAdminAnalytics);

module.exports = router;
