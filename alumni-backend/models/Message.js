const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  text: { type: String, required: true },
}, { timestamps: true });

module.exports = mongoose.model("Message", messageSchema);

// ** FUTURE PLANS**
///Notification of private chat ,event update and request from admin kept for future developed ! Donation and Online transaction to College 
// are also future planned ,admin can figure and sord transaction list as per requirement
// more over frontend integration is remain with proper styling 