const User = require("../models/User");
const Event = require("../models/Event");
const Discussion = require("../models/Discussion");
const Feedback = require("../models/Feedback");
const Message = require("../models/Message");
const MentorshipRequest = require("../models/MentorshipRequest");

const withTimeout = async (url, timeoutMs = 5000) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timeout);
  }
};

const buildCollegeInfo = ({ collegeId }) => {
  const profileMap = {
    COLLEGE_1: {
      name: "AISSMS Institute of Information Technology",
      location: "Pune, Maharashtra",
      establishedYear: 1999,
      accreditation: "NAAC Accredited",
      focusAreas: ["AI/ML", "Cybersecurity", "Full-Stack Development"],
    },
    COLLEGE_2: {
      name: "Global Engineering and Technology Campus",
      location: "Mumbai, Maharashtra",
      establishedYear: 2002,
      accreditation: "NBA + NAAC Accredited",
      focusAreas: ["Cloud Engineering", "Robotics", "Data Science"],
    },
  };

  return (
    profileMap[collegeId] || {
      name: `${collegeId} College Network`,
      location: "India",
      establishedYear: 2000,
      accreditation: "AICTE Approved",
      focusAreas: ["Software Engineering", "Leadership", "Industry Mentorship"],
    }
  );
};

const getTechNews = async () => {
  const fallbackNews = [
    {
      title: "Open-source AI tooling ecosystem continues to accelerate",
      source: "Tech Digest",
      url: "https://news.ycombinator.com/",
      publishedAt: new Date().toISOString(),
    },
    {
      title: "Global cloud adoption rises among higher-education institutions",
      source: "Cloud Insights",
      url: "https://news.ycombinator.com/",
      publishedAt: new Date().toISOString(),
    },
    {
      title: "Cybersecurity awareness becomes a top student skill priority",
      source: "Security Weekly",
      url: "https://news.ycombinator.com/",
      publishedAt: new Date().toISOString(),
    },
  ];

  try {
    const response = await withTimeout(
      "https://hn.algolia.com/api/v1/search_by_date?query=technology%20software%20engineering&tags=story",
      5000
    );

    if (!response.ok) return fallbackNews;
    const json = await response.json();
    const hits = Array.isArray(json?.hits) ? json.hits : [];

    const normalized = hits
      .filter((item) => item?.title && item?.url)
      .slice(0, 5)
      .map((item) => ({
        title: item.title,
        source: "Hacker News",
        url: item.url,
        publishedAt: item.created_at,
      }));

    return normalized.length > 0 ? normalized : fallbackNews;
  } catch (error) {
    console.error("Tech news fetch warning:", error.message);
    return fallbackNews;
  }
};

exports.getDashboardSummary = async (req, res) => {
  try {
    if (!["student", "admin"].includes(req.user.role)) {
      return res.status(403).json({ msg: "Dashboard summary is available for student/admin only" });
    }

    const collegeId = req.user.collegeId;
    const isAdminViewer = req.user.role === "admin";

    const [
      totalUsers,
      totalStudents,
      totalAlumni,
      verifiedAlumni,
      pendingUsers,
      eventCount,
      discussionCount,
      messageCount,
      mentorshipCount,
      openComplaints,
      recentEvents,
      recentDiscussions,
      recentFeedback,
      techNews,
    ] = await Promise.all([
      User.countDocuments({ collegeId, role: { $in: ["student", "alumni"] } }),
      User.countDocuments({ collegeId, role: "student" }),
      User.countDocuments({ collegeId, role: "alumni" }),
      User.countDocuments({ collegeId, role: "alumni", verified: true, blocked: false }),
      User.countDocuments({ collegeId, role: { $in: ["student", "alumni"] }, verified: false }),
      Event.countDocuments({ collegeId }),
      Discussion.countDocuments({ collegeId, isDeleted: false }),
      Message.countDocuments({ collegeId }),
      MentorshipRequest.countDocuments({ collegeId }),
      Feedback.countDocuments({ collegeId, category: "complaint", status: { $ne: "resolved" } }),
      Event.find({ collegeId }).sort({ date: -1 }).limit(3).select("title date venue").lean(),
      Discussion.find({ collegeId, isDeleted: false })
        .sort({ createdAt: -1 })
        .limit(3)
        .populate("user", "name role")
        .select("content createdAt user")
        .lean(),
      Feedback.find({ collegeId })
        .sort({ createdAt: -1 })
        .limit(3)
        .populate("userId", "name role")
        .select("category subject createdAt userId status")
        .lean(),
      getTechNews(),
    ]);

    const collegeInfo = buildCollegeInfo({ collegeId });
    const feedbackNews = isAdminViewer
      ? recentFeedback.map((item) => ({
          type: item.category,
          title: `${item.userId?.name || "User"} raised ${item.category}`,
          summary: item.subject,
          createdAt: item.createdAt,
        }))
      : [];

    const collegeNews = [
      ...recentEvents.map((event) => ({
        type: "event",
        title: event.title,
        summary: `Upcoming at ${event.venue || "campus venue"} on ${new Date(event.date).toLocaleDateString()}`,
        createdAt: event.date,
      })),
      ...recentDiscussions.map((post) => ({
        type: "discussion",
        title: `${post.user?.name || "Community member"} posted in discussion`,
        summary: String(post.content || "").slice(0, 120),
        createdAt: post.createdAt,
      })),
      ...feedbackNews,
    ]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      .slice(0, 8);

    return res.json({
      success: true,
      asOf: new Date().toISOString(),
      metrics: {
        totalUsers,
        totalStudents,
        totalAlumni,
        verifiedAlumni,
        pendingUsers,
        eventCount,
        discussionCount,
        messageCount,
        mentorshipCount,
        openComplaints,
      },
      collegeInfo,
      collegeNews,
      techNews,
    });
  } catch (err) {
    console.error("Dashboard summary error:", err);
    return res.status(500).json({ msg: "Server error", error: err.message });
  }
};
