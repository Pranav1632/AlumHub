const express = require("express");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const {
  verifyUser,
  listPendingUsers,
  getAllStudents,
  getAllAlumni,
  blockUser,
  unblockUser,
} = require("../controllers/adminController");

const router = express.Router();

router.put("/verify/:id", protect, authorizeRoles("admin"), verifyUser);
router.get("/pending", protect, authorizeRoles("admin"), listPendingUsers);
router.get("/students", protect, authorizeRoles("admin"), getAllStudents);
router.get("/alumni", protect, authorizeRoles("admin"), getAllAlumni);
router.put("/block/:id", protect, authorizeRoles("admin"), blockUser);
router.put("/unblock/:id", protect, authorizeRoles("admin"), unblockUser);

module.exports = router;