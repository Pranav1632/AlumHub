import React, { useState } from "react";
import { v4 as uuidv4 } from "uuid";

export default function DiscussionPage() {
  const [posts, setPosts] = useState([
    {
      id: uuidv4(),
      author: "Alumni",
      role: "Alumni",
      content: "Excited for the upcoming hackathon!",
      createdAt: new Date(),
      likes: 2,
      replies: [],
    },
    {
      id: uuidv4(),
      author: "Student",
      role: "Student",
      content: "Anyone wants to join me for the robotics club?",
      createdAt: new Date(),
      likes: 0,
      replies: [],
    },
    {
      id: uuidv4(),
      author: "Admin",
      role: "Admin",
      content: "Reminder: Alumni meet is scheduled for Oct 10th!",
      createdAt: new Date(),
      likes: 5,
      replies: [],
    },
    {
      id: uuidv4(),
      author: "Student",
      role: "Student",
      content: "Just finished building my first React app 🚀",
      createdAt: new Date(),
      likes: 3,
      replies: [],
    },
    {
      id: uuidv4(),
      author: "Alumni",
      role: "Alumni",
      content: "Looking for mentees interested in cybersecurity.",
      createdAt: new Date(),
      likes: 1,
      replies: [],
    },
  ]);

  const [text, setText] = useState("");
  const [replyText, setReplyText] = useState({});
  const [showReplyBox, setShowReplyBox] = useState({});

  const addPost = () => {
    if (!text.trim()) return;
    const newPost = {
      id: uuidv4(),
      author: "Anonymous",
      role: "Student",
      content: text,
      createdAt: new Date(),
      likes: 0,
      replies: [],
    };
    setPosts([newPost, ...posts]);
    setText("");
  };

  const toggleLike = (id) => {
    setPosts(posts.map((p) => p.id === id ? { ...p, likes: p.likes + 1 } : p));
  };

  const toggleReplyBox = (id) => {
    setShowReplyBox({ ...showReplyBox, [id]: !showReplyBox[id] });
  };

  const addReply = (postId) => {
    if (!replyText[postId]?.trim()) return;
    const updatedPosts = posts.map((p) =>
      p.id === postId
        ? {
            ...p,
            replies: [
              ...p.replies,
              {
                id: uuidv4(),
                author: "You",
                content: replyText[postId],
                createdAt: new Date(),
              },
            ],
          }
        : p
    );
    setPosts(updatedPosts);
    setReplyText({ ...replyText, [postId]: "" });
    setShowReplyBox({ ...showReplyBox, [postId]: false });
  };

  const roleColors = {
    Student: "bg-blue-100 text-blue-800",
    Alumni: "bg-green-100 text-green-800",
    Admin: "bg-red-100 text-red-800",
  };

  return (
    <div className="max-w-6xl mx-auto mt-6 p-4 grid grid-cols-1 md:grid-cols-4 gap-6">
      {/* Feed Section */}
      <div className="md:col-span-3 space-y-4">
        <h2 className="text-3xl font-bold mb-4 text-green-600">Community Discussions</h2>
        {posts.map((p) => (
          <div key={p.id} className="p-3 bg-white border rounded-lg shadow-sm">
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center space-x-2">
                <h3 className="font-semibold text-gray-800">{p.author}</h3>
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${roleColors[p.role]}`}>
                  {p.role}
                </span>
              </div>
              <span className="text-gray-400 text-xs">
                {p.createdAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </span>
            </div>
            <p className="text-gray-700 mb-2">{p.content}</p>
            <div className="flex items-center space-x-4 text-sm">
              <button onClick={() => toggleLike(p.id)} className="text-gray-500 hover:text-red-500">
                👍 {p.likes}
              </button>
              <button onClick={() => toggleReplyBox(p.id)} className="text-gray-500 hover:text-blue-500">
                💬 Reply
              </button>
            </div>

            {/* Replies */}
            <div className="ml-4 mt-2 space-y-2">
              {p.replies.map((r) => (
                <div key={r.id} className="text-sm text-gray-700 border-l pl-3">
                  <strong>{r.author}</strong>: {r.content}
                </div>
              ))}
              {showReplyBox[p.id] && (
                <div className="flex mt-2 space-x-2">
                  <input
                    className="flex-1 p-2 border rounded text-sm"
                    placeholder="Write a reply..."
                    value={replyText[p.id] || ""}
                    onChange={(e) => setReplyText({ ...replyText, [p.id]: e.target.value })}
                  />
                  <button onClick={() => addReply(p.id)} className="px-3 py-1 bg-blue-500 text-white rounded text-sm">
                    Send
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

{/* Input Section Side Composer */}
<div className="md:col-span-1">
  <div className="sticky top-6 p-4 border rounded-lg shadow-sm bg-white">
    <h3 className="text-lg font-semibold mb-2 text-gray-700">Start a Discussion</h3>
    <input
      type="text"
      className="w-full h-14 px-5 border border-gray-300 rounded-full text-base shadow-sm focus:outline-none focus:ring-2 focus:ring-green-400"
      maxLength={3000}
      placeholder="Type your message (up to 500 words)..."
      value={text}
      onChange={(e) => setText(e.target.value)}
    />
    <button
      onClick={addPost}
      className="mt-4 w-full px-4 py-2 bg-green-500 text-white font-semibold rounded-full hover:bg-green-600"
    >
      Post
    </button>
  </div>
</div>
    </div>
  );
}