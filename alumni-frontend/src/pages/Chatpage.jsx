import React, { useState } from "react";

export default function ChatPage() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");

  const sendMessage = () => {
    if (!input.trim()) return;
    setMessages([...messages, { text: input, sender: "me" }]);
    setInput("");
  };

  return (
    <div>
      <h2>Chat</h2>
      <div style={{ border: "1px solid gray", height: "200px", overflowY: "auto" }}>
        {messages.map((msg, i) => (
          <p key={i}><b>{msg.sender}:</b> {msg.text}</p>
        ))}
      </div>
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Type message..."
      />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}
