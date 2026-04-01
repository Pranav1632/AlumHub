const express = require("express");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const { getVerifiedAlumni } = require("../controllers/alumniController");

const router = express.Router();

router.get("/verified", protect, authorizeRoles("student", "admin"), getVerifiedAlumni);

module.exports = router;