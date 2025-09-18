const Message = require("../models/Message");

// Send a message
exports.sendMessage = async (req, res) => {
  const { receiverId, text } = req.body;
  try {
    const newMessage = await Message.create({
      sender: req.user._id,
      receiver: receiverId,
      text,
    });
    res.json(newMessage);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get messages between logged-in user and another user
exports.getMessages = async (req, res) => {
  const { userId } = req.params;
  try {
    const messages = await Message.find({
      $or: [
        { sender: req.user._id, receiver: userId },
        { sender: userId, receiver: req.user._id },
      ],
    }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
