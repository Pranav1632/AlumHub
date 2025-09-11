const mongoose = require('mongoose');

const studentProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  phone: String,
  rollNumber: String,
  branch: String,
  yearOfStudy: String,
  graduationYear: String,
  profileImage: String,
  skills: [String],
  interests: [String],
  resumeLink: String,
}, { timestamps: true });

module.exports = mongoose.model('StudentProfile', studentProfileSchema);
