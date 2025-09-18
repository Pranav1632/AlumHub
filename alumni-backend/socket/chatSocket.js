const Message = require("../models/Message");

function chatSocket(io) {
  io.on("connection", (socket) => {
    console.log("User connected:", socket.id);

    socket.on("join", (userId) => {
      socket.join(userId);
    });

    socket.on("privateMessage", async ({ senderId, receiverId, text }) => {
      const newMessage = await Message.create({ sender: senderId, receiver: receiverId, text });
      io.to(receiverId).emit("privateMessage", newMessage);
    });

    socket.on("disconnect", () => {
      console.log("User disconnected:", socket.id);
    });
  });
}

module.exports = chatSocket;
