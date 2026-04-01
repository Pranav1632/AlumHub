const mongoose = require("mongoose");

const eventSchema = new mongoose.Schema(
  {
    collegeId: { type: String, required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    date: { type: Date, required: true },
    time: { type: String, default: "" },
    venue: { type: String, default: "" },
    registrationLink: { type: String, required: false },
    status: { type: String, enum: ["draft", "published"], default: "published" },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rsvps: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Event", eventSchema);