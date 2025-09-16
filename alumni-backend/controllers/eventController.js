const Event = require("../models/Event");

// @desc Create new event (collegeAdmin only)
const createEvent = async (req, res) => {
  try {
    const { title, description, date, time, venue } = req.body;

    const event = new Event({
      title,
      description,
      date,
      time,
      venue,
      createdBy: req.user._id,
    });

    await event.save();

    return res.status(201).json({ success: true, event });
  } catch (err) {
    console.error("Create event error:", err);
    res.status(500).json({ success: false, msg: "Server error", error: err.message });
  }
};

// @desc Get all events
const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find().populate("createdBy", "name email role");
    res.json({ success: true, count: events.length, events });
  } catch (err) {
    console.error("Get events error:", err);
    res.status(500).json({ success: false, msg: "Server error", error: err.message });
  }
};

// @desc Update event (collegeAdmin only)
const updateEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!event) return res.status(404).json({ success: false, msg: "Event not found" });

    res.json({ success: true, event });
  } catch (err) {
    console.error("Update event error:", err);
    res.status(500).json({ success: false, msg: "Server error", error: err.message });
  }
};

// @desc Delete event (collegeAdmin only)
const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findByIdAndDelete(req.params.id);
    if (!event) return res.status(404).json({ success: false, msg: "Event not found" });

    res.json({ success: true, msg: "Event deleted successfully" });
  } catch (err) {
    console.error("Delete event error:", err);
    res.status(500).json({ success: false, msg: "Server error", error: err.message });
  }
};

module.exports = { createEvent, getAllEvents, updateEvent, deleteEvent };
