import React, { useState } from "react";

export default function CommunityChat() {
  const [messages, setMessages] = useState([
    { sender: "Admin", text: "Welcome to the Alumni Community 🎉" },
    { sender: "Alumni1", text: "Hello everyone!" },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { sender: "You", text: input }]);
    setInput("");
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white shadow-md rounded-lg p-4 mt-6">
      <h2 className="text-xl font-semibold mb-3">Community Chat 💬</h2>
      <div className="h-64 overflow-y-auto border rounded-md p-2 bg-gray-50">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`mb-2 ${
              msg.sender === "You" ? "text-right" : "text-left"
            }`}
          >
            <span className="font-bold">{msg.sender}: </span>
            <span>{msg.text}</span>
          </div>
        ))}
      </div>
      <div className="flex mt-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type a message..."
          className="flex-grow border rounded-l-md p-2"
        />
        <button
          onClick={handleSend}
          className="bg-blue-500 text-white px-4 rounded-r-md hover:bg-blue-600"
        >
          Send
        </button>
      </div>
    </div>
  );
}
