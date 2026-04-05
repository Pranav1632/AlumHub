import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BiUpvote } from "react-icons/bi";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { FiMessageCircle, FiMessageSquare, FiSearch, FiSend, FiUser } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import api from "../utils/axiosInstance";
import { getErrorMessage } from "../utils/errorUtils";

const avatarFromName = (name) =>
  `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name || "User")}`;

const normalizeId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") return value._id ? String(value._id) : String(value);
  return String(value);
};

export default function DiscussionPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const meId = user?.id || user?._id;

  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState("");
  const [postText, setPostText] = useState("");
  const [replyDrafts, setReplyDrafts] = useState({});
  const [replyOpenFor, setReplyOpenFor] = useState({});
  const [replyListOpenFor, setReplyListOpenFor] = useState({});
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");

  const loadPosts = async () => {
    try {
      const res = await api.get("/discussions");
      setPosts(res.data || []);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load discussions"));
    }
  };

  useEffect(() => {
    loadPosts();
  }, []);

  const postMap = useMemo(() => {
    const map = new Map();
    posts.forEach((p) => map.set(normalizeId(p._id), { ...p, replies: [] }));
    posts.forEach((p) => {
      if (!p.parentId) return;
      const parentId = normalizeId(p.parentId);
      const parent = map.get(parentId);
      const child = map.get(normalizeId(p._id));
      if (parent && child) parent.replies.push(child);
    });
    return map;
  }, [posts]);

  const topLevelPosts = useMemo(() => {
    const q = search.trim().toLowerCase();
    const all = [...postMap.values()]
      .filter((p) => !p.parentId)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    if (!q) return all;
    return all.filter((p) => {
      const content = p.content?.toLowerCase() || "";
      const name = p.user?.name?.toLowerCase() || "";
      const role = p.user?.role?.toLowerCase() || "";
      return content.includes(q) || name.includes(q) || role.includes(q);
    });
  }, [postMap, search]);

  const createPost = async () => {
    const content = postText.trim();
    if (!content) return;
    try {
      setPosting(true);
      await api.post("/discussions", { content });
      setPostText("");
      await loadPosts();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to post discussion"));
    } finally {
      setPosting(false);
    }
  };

  const createReply = async (postId) => {
    const content = (replyDrafts[postId] || "").trim();
    if (!content) return;
    try {
      await api.post("/discussions", { content, parentId: postId });
      setReplyDrafts((prev) => ({ ...prev, [postId]: "" }));
      await loadPosts();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to post reply"));
    }
  };

  const toggleLike = async (postId) => {
    try {
      await api.post(`/discussions/${postId}/like`);
      await loadPosts();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to like post"));
    }
  };

  const toggleUpvote = async (postId) => {
    try {
      await api.post(`/discussions/${postId}/upvote`);
      await loadPosts();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to upvote post"));
    }
  };

  const renderPost = (post, isReply = false) => {
    const postId = normalizeId(post._id);
    const likes = Array.isArray(post.likes) ? post.likes : [];
    const upvotes = Array.isArray(post.upvotes) ? post.upvotes : [];
    const replies = Array.isArray(post.replies) ? post.replies : [];
    const likedByMe = likes.some((id) => normalizeId(id) === normalizeId(meId));
    const upvotedByMe = upvotes.some((id) => normalizeId(id) === normalizeId(meId));
    const userName = post.user?.name || "User";
    const userId = normalizeId(post.user?._id);
    const avatar = avatarFromName(userName);

    return (
      <div key={postId} className={`rounded-xl border border-slate-200 bg-white p-4 ${isReply ? "ml-3 sm:ml-8 mt-2" : ""}`}>
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate(`/profile/visit/${normalizeId(post.user?._id)}`)}
            className="h-10 w-10 rounded-full overflow-hidden border border-slate-200 hover:border-blue-400 shrink-0"
            title="Visit profile"
          >
            <img
              src={avatar}
              alt={userName}
              className="h-full w-full object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <p className="font-semibold text-slate-800">{userName}</p>
              <span className="text-[11px] text-slate-500 capitalize">{post.user?.role || "member"}</span>
              <span className="text-[11px] text-slate-400">{new Date(post.createdAt).toLocaleString()}</span>
            </div>
            <p className="text-slate-700 mt-1 whitespace-pre-wrap">{post.content}</p>

            <div className="mt-3 flex items-center gap-3">
              <button
                onClick={() => toggleUpvote(postId)}
                className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${
                  upvotedByMe ? "border-blue-600 text-blue-700 bg-blue-50" : "border-slate-300 text-slate-600 hover:bg-slate-50"
                }`}
              >
                <BiUpvote size={16} /> {upvotes.length}
              </button>
              <button
                onClick={() => toggleLike(postId)}
                className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${
                  likedByMe ? "border-rose-500 text-rose-600 bg-rose-50" : "border-slate-300 text-slate-600 hover:bg-slate-50"
                }`}
              >
                {likedByMe ? <FaHeart size={13} /> : <FaRegHeart size={13} />} {likes.length}
              </button>
              {!isReply && (
                <button
                  onClick={() => setReplyOpenFor((prev) => ({ ...prev, [postId]: !prev[postId] }))}
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50"
                >
                  <FiMessageCircle size={14} /> Reply
                </button>
              )}
              {!isReply &&
                userId &&
                normalizeId(meId) !== userId &&
                !(user?.role === "student" && post.user?.role === "student") && (
                <button
                  onClick={() =>
                    navigate("/chat", {
                      state: {
                        chatTarget: {
                          _id: userId,
                          name: userName,
                          email: post.user?.email,
                          prn: post.user?.prn,
                        },
                      },
                    })
                  }
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                >
                  <FiMessageSquare size={14} /> Private Chat
                </button>
              )}
              {!isReply && replies.length > 0 && (
                <button
                  onClick={() =>
                    setReplyListOpenFor((prev) => ({
                      ...prev,
                      [postId]: !prev[postId],
                    }))
                  }
                  className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full border border-slate-300 text-slate-600 hover:bg-slate-50"
                  title="Show replies"
                >
                  <FiMessageCircle size={14} /> {replies.length}
                </button>
              )}
            </div>

            {!isReply && replyOpenFor[postId] && (
              <div className="mt-3 flex items-start gap-2">
                <textarea
                  rows={2}
                  value={replyDrafts[postId] || ""}
                  onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [postId]: e.target.value }))}
                  placeholder="Write a reply..."
                  className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm"
                />
                <button
                  onClick={() => createReply(postId)}
                  className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm"
                >
                  Send
                </button>
              </div>
            )}
          </div>
        </div>

        {!isReply && replyListOpenFor[postId] && replies.length > 0 && (
          <div className="mt-3">
            {replies
              .sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
              .map((reply) => renderPost(reply, true))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white via-slate-50 to-white py-6 px-4 pb-40">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white border border-slate-200 rounded-xl p-3 mb-4 sticky top-24 z-20">
          <div className="relative">
            <FiSearch className="absolute left-3 top-2.5 text-slate-400" size={14} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search discussions by user, role or text"
              className="w-full border border-slate-300 rounded-lg pl-8 pr-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="space-y-3">
          {topLevelPosts.map((post) => renderPost(post))}
          {topLevelPosts.length === 0 && (
            <div className="bg-white border border-slate-200 rounded-xl p-5 text-sm text-slate-500">
              No discussions found.
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
      </div>

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[min(1024px,92vw)] z-30">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-lg p-3">
          <textarea
            rows={2}
            maxLength={3000}
            value={postText}
            onChange={(e) => setPostText(e.target.value)}
            placeholder="Start a discussion with your college community..."
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm"
          />
          <div className="mt-2 flex items-center justify-between">
            <span className="text-xs text-slate-500">{postText.length}/3000</span>
            <button
              onClick={createPost}
              disabled={posting || !postText.trim()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:bg-blue-300"
            >
              <FiSend size={14} /> {posting ? "Posting..." : "Post"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
