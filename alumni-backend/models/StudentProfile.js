const mongoose = require("mongoose");

const studentProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    collegeId: { type: String, required: true, index: true },
    phone: String,
    rollNumber: String,
    branch: String,
    yearOfStudy: String,
    graduationYear: String,
    profileImage: String,
    bio: String,
    headline: String,
    location: String,
    skills: [String],
    interests: [String],
    achievements: [String],
    linkedIn: String,
    github: String,
    portfolio: String,
    resumeLink: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("StudentProfile", studentProfileSchema);
