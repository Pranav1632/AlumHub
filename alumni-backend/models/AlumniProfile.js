const mongoose = require("mongoose");

const alumniProfileSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    collegeId: { type: String, required: true, index: true },
    phone: String,
    rollNumber: String,
    branch: String,
    graduationYear: String,
    currentCompany: String,
    jobTitle: String,
    location: String,
    linkedIn: String,
    github: String,
    portfolio: String,
    profileImage: String,
    bio: String,
    headline: String,
    skills: [String],
    interests: [String],
    achievements: [String],
    resumeLink: String,
    lastYearFeeReceiptUrl: String,
    willingToMentor: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("AlumniProfile", alumniProfileSchema);
