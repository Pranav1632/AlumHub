const mongoose = require("mongoose");

const discussionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Discussion", discussionSchema);
 

