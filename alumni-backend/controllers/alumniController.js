const User = require("../models/User");
const AlumniProfile = require("../models/AlumniProfile");

const getVerifiedAlumni = async (req, res) => {
  try {
    const alumniUsers = await User.find({
      role: "alumni",
      verified: true,
      blocked: false,
      collegeId: req.user.collegeId,
    })
      .select("name email prn role collegeId createdAt lastLoginAt verified")
      .sort({ lastLoginAt: -1, createdAt: -1 })
      .lean();

    const userIds = alumniUsers.map((item) => item._id);
    const profiles = await AlumniProfile.find({
      collegeId: req.user.collegeId,
      user: { $in: userIds },
    })
      .select(
        "user branch graduationYear currentCompany jobTitle location headline bio skills interests achievements profileImage linkedIn github portfolio resumeLink lastYearFeeReceiptUrl"
      )
      .lean();

    const profileMap = new Map(profiles.map((profile) => [String(profile.user), profile]));
    const alumni = alumniUsers.map((item) => ({
      ...item,
      profile: profileMap.get(String(item._id)) || null,
    }));

    return res.json({ success: true, count: alumni.length, alumni });
  } catch (err) {
    console.error("Error fetching verified alumni:", err);
    return res.status(500).json({ success: false, msg: "Server error", error: err.message });
  }
};

module.exports = { getVerifiedAlumni };
