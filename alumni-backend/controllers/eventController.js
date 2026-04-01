const Event = require("../models/Event");
const { getCollegeAudienceIds, notifyUsers } = require("../utils/notificationService");

const createEvent = async (req, res) => {
  try {
    const { title, description, date, time, venue, registrationLink, status } = req.body;

    const event = new Event({
      collegeId: req.user.collegeId,
      title,
      description,
      date,
      time,
      venue,
      registrationLink,
      status: status || "published",
      createdBy: req.user._id,
    });

    await event.save();

    const io = req.app.get("io");
    const audience = await getCollegeAudienceIds({
      collegeId: req.user.collegeId,
      excludeUserId: req.user._id,
    });
    await notifyUsers({
      io,
      collegeId: req.user.collegeId,
      userIds: audience,
      type: "event_update",
      title: "New Event Published",
      message: `${title} has been added to your college calendar.`,
      meta: { eventId: event._id, action: "created" },
    });

    return res.status(201).json({ success: true, event });
  } catch (err) {
    console.error("Create event error:", err);
    return res.status(500).json({ success: false, msg: "Server error", error: err.message });
  }
};

const getAllEvents = async (req, res) => {
  try {
    const events = await Event.find({ collegeId: req.user.collegeId })
      .populate("createdBy", "name email role")
      .sort({ date: 1 });
    return res.json({ success: true, count: events.length, events });
  } catch (err) {
    console.error("Get events error:", err);
    return res.status(500).json({ success: false, msg: "Server error", error: err.message });
  }
};

const updateEvent = async (req, res) => {
  try {
    const event = await Event.findOneAndUpdate(
      { _id: req.params.id, collegeId: req.user.collegeId },
      req.body,
      { new: true }
    );

    if (!event) return res.status(404).json({ success: false, msg: "Event not found" });

    const io = req.app.get("io");
    const audience = await getCollegeAudienceIds({
      collegeId: req.user.collegeId,
      excludeUserId: req.user._id,
    });
    await notifyUsers({
      io,
      collegeId: req.user.collegeId,
      userIds: audience,
      type: "event_update",
      title: "Event Updated",
      message: `${event.title} has been updated in your calendar.`,
      meta: { eventId: event._id, action: "updated" },
    });

    return res.json({ success: true, event });
  } catch (err) {
    console.error("Update event error:", err);
    return res.status(500).json({ success: false, msg: "Server error", error: err.message });
  }
};

const deleteEvent = async (req, res) => {
  try {
    const event = await Event.findOneAndDelete({ _id: req.params.id, collegeId: req.user.collegeId });

    if (!event) return res.status(404).json({ success: false, msg: "Event not found" });

    const io = req.app.get("io");
    const audience = await getCollegeAudienceIds({
      collegeId: req.user.collegeId,
      excludeUserId: req.user._id,
    });
    await notifyUsers({
      io,
      collegeId: req.user.collegeId,
      userIds: audience,
      type: "event_update",
      title: "Event Removed",
      message: `${event.title} has been removed from your calendar.`,
      meta: { eventId: event._id, action: "deleted" },
    });

    return res.json({ success: true, msg: "Event deleted successfully" });
  } catch (err) {
    console.error("Delete event error:", err);
    return res.status(500).json({ success: false, msg: "Server error", error: err.message });
  }
};

module.exports = { createEvent, getAllEvents, updateEvent, deleteEvent };
