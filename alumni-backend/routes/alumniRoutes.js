// routes/alumniRoutes.js
const express = require("express");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const { getVerifiedAlumni } = require("../controllers/alumniController");

const router = express.Router();

/**
 * Student can view verified alumni
 * GET /api/alumni/verified
 */
router.get("/verified", protect, authorizeRoles("student"), getVerifiedAlumni);

module.exports = router;
