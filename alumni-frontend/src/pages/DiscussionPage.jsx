import React, { useState } from "react";

export default function DiscussionPage() {
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState("");

  const addPost = () => {
    if (!text.trim()) return;
    setPosts([...posts, { content: text, author: "You" }]);
    setText("");
  };

  return (
    <div>
      <h2>Discussions</h2>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Write something..."
      />
      <button onClick={addPost}>Post</button>

      <div>
        {posts.map((p, i) => (
          <p key={i}><b>{p.author}:</b> {p.content}</p>
        ))}
      </div>
    </div>
  );
}
