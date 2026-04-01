const express = require("express");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const {
  createEvent,
  getAllEvents,
  updateEvent,
  deleteEvent,
} = require("../controllers/eventController");

const router = express.Router();

router.get("/", protect, getAllEvents);
router.post("/", protect, authorizeRoles("admin"), createEvent);
router.put("/:id", protect, authorizeRoles("admin"), updateEvent);
router.delete("/:id", protect, authorizeRoles("admin"), deleteEvent);

module.exports = router;