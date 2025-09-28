import React, { useState } from "react";
import "./css-pages/private-messaging.css";

export default function ChatPage() {
  const [contacts, setContacts] = useState([
    {
      id: 1,
      name: "John Doe",
      avatar: "https://avatar.iran.liara.run/public/13",
      status: "online",
      lastMessage: "Hey, are you free for a call?",
      lastTime: "10:30 AM",
      unread: 3,
      messages: [
        { sender: "me", text: "Hi John, how are you? Just checking in about the alumni mentorship program.", time: "10:28 AM" },
        { sender: "other", text: "Hey! I'm doing great, thanks! Yes, interested in the mentorship program. What did you have in mind?", time: "10:30 AM" },
        { sender: "me", text: "Great! Let's set up a virtual coffee chat next week. Does that sound good?", time: "10:32 AM" },
        { sender: "other", text: "Perfect! I'm free on Tuesday or Thursday afternoon.", time: "10:35 AM" },
      ],
    },
    {
      id: 2,
      name: "Alice Johnson",
      avatar: "https://avatar.iran.liara.run/public/55",
      status: "offline",
      lastMessage: "I've sent the project details.",
      lastTime: "Yesterday",
      unread: 0,
      messages: [],
    },
    {
      id: 3,
      name: "Robert Peterson",
      avatar: "https://avatar.iran.liara.run/public/49",
      status: "online",
      lastMessage: "New event details posted!",
      lastTime: "8:15 AM",
      unread: 1,
      messages: [],
    },
  ]);

  const [activeContactId, setActiveContactId] = useState(1);
  const [input, setInput] = useState("");

  const activeContact = contacts.find(c => c.id === activeContactId);

  const sendMessage = () => {
    if (!input.trim()) return;
    const updatedContacts = contacts.map(c => {
      if (c.id === activeContactId) {
        return {
          ...c,
          messages: [...c.messages, { sender: "me", text: input, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }],
        };
      }
      return c;
    });
    setContacts(updatedContacts);
    setInput("");
  };

  return (
    <div className="portal-wrapper">
      <div className="messaging-layout">
        {/* --- Sidebar --- */}
        <aside className="message-sidebar">
          <div className="sidebar-header">
            <h3>Conversations</h3>
            <button className="icon-button new-chat-btn">
              <i className="material-icons">add_comment</i>
            </button>
          </div>
          <div className="search-contacts">
            <i className="material-icons search-icon">search</i>
            <input type="text" placeholder="Search contacts..." className="contact-search-input" />
          </div>
          <div className="contact-list">
            {contacts.map(contact => (
              <div
                key={contact.id}
                className={`contact-item ${contact.id === activeContactId ? "active" : ""}`}
                onClick={() => setActiveContactId(contact.id)}
              >
                <div className="contact-avatar">
                  <img src={contact.avatar} alt={contact.name} />
                  <span className={`status-indicator ${contact.status}`}></span>
                </div>
                <div className="contact-info">
                  <h4>{contact.name}</h4>
                  <p className="last-message">{contact.lastMessage}</p>
                </div>
                <div className="contact-meta">
                  <span className="message-time">{contact.lastTime}</span>
                  {contact.unread > 0 && <span className="unread-count">{contact.unread}</span>}
                </div>
              </div>
            ))}
          </div>
        </aside>

        {/* --- Chat Area --- */}
        <main className="chat-area">
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="contact-avatar">
                <img src={activeContact.avatar} alt={activeContact.name} />
                <span className={`status-indicator ${activeContact.status}`}></span>
              </div>
              <h4>{activeContact.name}</h4>
              <span className="chat-status">{activeContact.status === "online" ? "Online" : activeContact.status === "away" ? "Away" : "Offline"}</span>
            </div>
            <div className="chat-header-actions">
              <button className="icon-button"><i className="material-icons">videocam</i></button>
              <button className="icon-button"><i className="material-icons">call</i></button>
              <button className="icon-button"><i className="material-icons">more_vert</i></button>
            </div>
          </div>

          <div className="message-list">
            {activeContact.messages.map((msg, idx) => (
              <div key={idx} className={`message ${msg.sender === "me" ? "sent" : "received"}`}>
                {msg.sender === "other" && (
                  <div className="message-avatar">
                    <img src={activeContact.avatar} alt={activeContact.name} />
                  </div>
                )}
                <div className={msg.sender === "me" ? "message-bubble" : "message-content"}>
                  <div className="message-bubble">{msg.text}</div>
                  <span className="message-timestamp">{msg.time}</span>
                </div>
                {msg.sender === "me" && (
                  <div className="message-avatar sender-avatar">
                    <img src="https://avatar.iran.liara.run/public/17" alt="You" />
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="message-input-area">
            <button className="icon-button attachment-btn"><i className="material-icons">attach_file</i></button>
            <textarea
              className="message-input"
              rows="1"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), sendMessage())}
            />
            <button className="icon-button send-btn" onClick={sendMessage}>
              <i className="material-icons">send</i>
            </button>
          </div>
        </main>
      </div>
    </div>
  );
}
