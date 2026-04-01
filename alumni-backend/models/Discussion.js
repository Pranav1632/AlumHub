const mongoose = require("mongoose");

const discussionSchema = new mongoose.Schema(
  {
    collegeId: { type: String, required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true },
    parentId: { type: mongoose.Schema.Types.ObjectId, ref: "Discussion", default: null },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    upvotes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Discussion", discussionSchema);
