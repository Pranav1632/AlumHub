const express = require("express");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const { getDashboardSummary } = require("../controllers/dashboardController");

const router = express.Router();

router.get("/summary", protect, authorizeRoles("student", "admin"), getDashboardSummary);

module.exports = router;
