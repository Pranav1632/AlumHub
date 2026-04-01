const Discussion = require("../models/Discussion");

exports.createDiscussion = async (req, res) => {
  try {
    const { content, parentId = null } = req.body;
    if (!content) return res.status(400).json({ message: "Content is required" });

    const post = await Discussion.create({
      collegeId: req.user.collegeId,
      user: req.user.id,
      content,
      parentId,
    });
    return res.status(201).json(post);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getAllDiscussions = async (req, res) => {
  try {
    const posts = await Discussion.find({ collegeId: req.user.collegeId, isDeleted: false })
      .populate("user", "name role")
      .sort({ createdAt: -1 });

    return res.json(posts);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};

exports.getMyDiscussions = async (req, res) => {
  try {
    const posts = await Discussion.find({
      collegeId: req.user.collegeId,
      user: req.user.id,
      isDeleted: false,
    }).sort({ createdAt: -1 });

    return res.json(posts);
  } catch (err) {
    return res.status(500).json({ message: err.message });
  }
};