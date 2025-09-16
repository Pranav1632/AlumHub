const express = require("express");
const { protect, authorizeRoles } = require("../middleware/authMiddleware");
const {
  createEvent,
  getAllEvents,
  updateEvent,
  deleteEvent,
} = require("../controllers/eventController");

const router = express.Router();

// Public / Student / Alumni → Can view all events
router.get("/", protect, getAllEvents);

// College Admin → Manage events
router.post("/", protect, authorizeRoles("collegeAdmin"), createEvent);
router.put("/:id", protect, authorizeRoles("collegeAdmin"), updateEvent);
router.delete("/:id", protect, authorizeRoles("collegeAdmin"), deleteEvent);

module.exports = router;
