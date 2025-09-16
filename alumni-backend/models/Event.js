const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String },
    date: { type: Date, required: true },
    time: { type: String }, // e.g., "10:00 AM - 12:00 PM"
    venue: { type: String },
     registrationLink: {
      type: String,
      required: false, // optional — some events may not need a link
    },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);
