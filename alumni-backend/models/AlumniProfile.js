const mongoose = require('mongoose');

const alumniProfileSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  phone: String,
  rollNumber: String,  // optional
  branch: String,
  graduationYear: String,
  currentCompany: String,
  jobTitle: String,
  location: String,
  linkedIn: String,
  profileImage: String,
  achievements: [String],
  willingToMentor: { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('AlumniProfile', alumniProfileSchema);




