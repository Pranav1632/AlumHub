const express = require("express");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const {
  verifyUser,
  listPendingUsers,
  getAllStudents,
  getAllAlumni,
} = require("../controllers/adminController");

const router = express.Router();

// Verify student/alumni
router.put("/verify/:id", protect, authorizeRoles("collegeAdmin"), verifyUser);

// List pending (unverified) users
router.get("/pending", protect, authorizeRoles("collegeAdmin"), listPendingUsers);

// Get all students
router.get("/students", protect, authorizeRoles("collegeAdmin"), getAllStudents);

// Get all alumni
router.get("/alumni", protect, authorizeRoles("collegeAdmin"), getAllAlumni);

module.exports = router;
