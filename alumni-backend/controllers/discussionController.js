const Discussion = require("../models/Discussion");

// Create a new post
exports.createDiscussion = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content) return res.status(400).json({ message: "Content is required" });

    const post = await Discussion.create({ user: req.user.id, content });
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get all posts
exports.getAllDiscussions = async (req, res) => {
  try {
    const posts = await Discussion.find().populate("user", "name email").sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get logged-in user’s posts
exports.getMyDiscussions = async (req, res) => {
  try {
    const posts = await Discussion.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
