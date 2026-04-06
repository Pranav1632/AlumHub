const mongoose = require("mongoose");
const Discussion = require("../models/Discussion");
const { notifyUser } = require("../utils/notificationService");

const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(value);
const ADMIN_DISCUSSION_TAGS = new Set(["announcement", "alert", "notice", "update", "event", "opportunity"]);

exports.createDiscussion = async (req, res) => {
  try {
    if (req.user.role !== "admin" && req.user.communityChatBlocked) {
      return res.status(403).json({ message: "Your community discussion access is blocked by admin" });
    }

    const content = String(req.body?.content || "").trim();
    const parentId = req.body?.parentId || null;
    const tagInput = String(req.body?.tag || "").trim().toLowerCase();

    if (!content) return res.status(400).json({ message: "Content is required" });

    if (tagInput && req.user.role !== "admin") {
      return res.status(403).json({ message: "Only admin can post tagged community messages" });
    }

    if (tagInput && !ADMIN_DISCUSSION_TAGS.has(tagInput)) {
      return res.status(400).json({ message: "Invalid discussion tag" });
    }

    let parentPost = null;
    if (parentId) {
      if (!isValidObjectId(parentId)) {
        return res.status(400).json({ message: "Invalid parentId format" });
      }

      parentPost = await Discussion.findOne({
        _id: parentId,
        collegeId: req.user.collegeId,
        isDeleted: false,
      }).select("_id user");

      if (!parentPost) {
        return res.status(404).json({ message: "Parent discussion not found" });
      }
    }

    const post = await Discussion.create({
      collegeId: req.user.collegeId,
      user: req.user.id,
      content,
      parentId,
      tag: req.user.role === "admin" ? tagInput : "",
    });

    const populatedPost = await Discussion.findById(post._id).populate("user", "name role email prn");

    if (parentPost && String(parentPost.user) !== String(req.user._id)) {
      const io = req.app.get("io");
      await notifyUser({
        io,
        collegeId: req.user.collegeId,
        userId: parentPost.user,
        type: "discussion_reply",
        title: "New Reply On Your Post",
        message: `${req.user.name} replied to your discussion.`,
        meta: { discussionId: parentPost._id, replyId: post._id },
      });
    }

    return res.status(201).json(populatedPost);
  } catch (err) {
    console.error("createDiscussion error:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.getAllDiscussions = async (req, res) => {
  try {
    const posts = await Discussion.find({ collegeId: req.user.collegeId, isDeleted: false })
      .populate("user", "name role email prn")
      .sort({ createdAt: -1 });

    return res.json(posts);
  } catch (err) {
    console.error("getAllDiscussions error:", err);
    return res.status(500).json({ message: err.message });
  }
};

exports.getMyDiscussions = async (req, res) => {
  try {
    const posts = await Discussion.find({
      collegeId: req.user.collegeId,
      user: req.user.id,
      isDeleted: false,
    })
      .populate("user", "name role email prn")
      .sort({ createdAt: -1 });

    return res.json(posts);
  } catch (err) {
    console.error("getMyDiscussions error:", err);
    return res.status(500).json({ message: err.message });
  }
};

const toggleReaction = async (req, res, field, label) => {
  try {
    if (req.user.role !== "admin" && req.user.communityChatBlocked) {
      return res.status(403).json({ message: "Your community discussion access is blocked by admin" });
    }

    const post = await Discussion.findOne({
      _id: req.params.id,
      collegeId: req.user.collegeId,
      isDeleted: false,
    });

    if (!post) return res.status(404).json({ message: "Discussion not found" });

    const currentIds = (post[field] || []).map((id) => String(id));
    const myId = String(req.user._id);
    const alreadyReacted = currentIds.includes(myId);

    if (alreadyReacted) {
      post[field] = post[field].filter((id) => String(id) !== myId);
    } else {
      post[field].push(req.user._id);
    }

    await post.save();

    if (!alreadyReacted && String(post.user) !== myId) {
      const io = req.app.get("io");
      await notifyUser({
        io,
        collegeId: req.user.collegeId,
        userId: post.user,
        type: "discussion_reaction",
        title: `New ${label} On Your Post`,
        message: `${req.user.name} added a ${label.toLowerCase()} to your discussion.`,
        meta: { discussionId: post._id, reaction: label.toLowerCase() },
      });
    }

    return res.json({
      success: true,
      id: post._id,
      likesCount: post.likes?.length || 0,
      upvotesCount: post.upvotes?.length || 0,
      likedByMe: (post.likes || []).some((id) => String(id) === myId),
      upvotedByMe: (post.upvotes || []).some((id) => String(id) === myId),
    });
  } catch (err) {
    console.error(`toggle ${field} error:`, err);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.toggleLike = async (req, res) => toggleReaction(req, res, "likes", "Like");
exports.toggleUpvote = async (req, res) => toggleReaction(req, res, "upvotes", "Upvote");
