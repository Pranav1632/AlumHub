import React, { useEffect, useState } from "react";
import api from "../utils/axiosInstance";

export default function DiscussionPage() {
  const [posts, setPosts] = useState([]);
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const loadPosts = async () => {
    try {
      const res = await api.get("/discussions");
      setPosts(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load discussions");
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const addPost = async () => {
    if (!text.trim()) return;
    try {
      await api.post("/discussions", { content: text.trim() });
      setText("");
      await loadPosts();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to post discussion");
    }
  };

  return (
    <div className="max-w-4xl mx-auto mt-6 p-4">
      <h2 className="text-3xl font-bold mb-4 text-slate-800">Community Discussions</h2>

      <div className="bg-white border rounded-lg p-4 mb-5">
        <textarea
          className="w-full border rounded-md p-3"
          rows={3}
          maxLength={3000}
          placeholder="Write your discussion post"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button onClick={addPost} className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-md">
          Post
        </button>
      </div>

      <div className="space-y-3">
        {posts.map((p) => (
          <div key={p._id} className="bg-white border rounded-lg p-4">
            <div className="flex justify-between mb-1">
              <p className="font-semibold">{p.user?.name || "User"}</p>
              <p className="text-xs text-slate-500">{new Date(p.createdAt).toLocaleString()}</p>
            </div>
            <p className="text-slate-700">{p.content}</p>
          </div>
        ))}
      </div>

      {error && <p className="text-red-600 text-sm mt-4">{error}</p>}
    </div>
  );
}