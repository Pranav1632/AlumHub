import React, { useState } from "react";

export default function CommunityChat() {
  const [messages, setMessages] = useState([
    { sender: "Admin", text: "Welcome to the Alumni Community." },
    { sender: "Alumni1", text: "Hello everyone!" },
  ]);
  const [input, setInput] = useState("");

  const handleSend = () => {
    const text = input.trim();
    if (!text) return;
    setMessages((prev) => [...prev, { sender: "You", text }]);
    setInput("");
  };

  return (
    <div className="w-full max-w-lg mx-auto bg-white shadow-md rounded-xl border border-slate-200 p-4 mt-6">
      <h2 className="text-xl font-semibold mb-3">Community Chat</h2>
      <div className="h-64 overflow-y-auto border rounded-md p-2 bg-gray-50">
        {messages.map((msg, i) => (
          <div key={i} className={`mb-2 ${msg.sender === "You" ? "text-right" : "text-left"}`}>
            <span className="font-bold">{msg.sender}: </span>
            <span>{msg.text}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-2">
        <div className="mb-1 flex items-center justify-between text-[11px] text-slate-500">
          <span>Type and press Send</span>
          <span>{input.length}/500</span>
        </div>
        <div className="flex gap-2">
          <textarea
            rows={2}
            maxLength={500}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type a message..."
            className="flex-grow resize-none border rounded-xl p-2 text-sm"
          />
          <button
            onClick={handleSend}
            className="bg-blue-600 text-white px-4 rounded-xl hover:bg-blue-700 text-sm font-medium"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
