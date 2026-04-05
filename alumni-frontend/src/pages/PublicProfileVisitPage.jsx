import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaGithub, FaLinkedin, FaMapMarkerAlt } from "react-icons/fa";
import { FiArrowLeft, FiMessageSquare, FiUser } from "react-icons/fi";
import api from "../utils/axiosInstance";
import { getErrorMessage } from "../utils/errorUtils";
import { useAuth } from "../context/AuthContext";

const listOrDash = (value) => {
  if (Array.isArray(value) && value.length > 0) return value.join(", ");
  if (typeof value === "string" && value.trim()) return value;
  return "-";
};

const defaultAvatar = (name) =>
  `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name || "User")}`;

export default function PublicProfileVisitPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: me } = useAuth();

  const [payload, setPayload] = useState({ user: null, profile: null });
  const [chatRequestStatus, setChatRequestStatus] = useState("none");
  const [chatRequestId, setChatRequestId] = useState("");
  const [requestLoading, setRequestLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [banner, setBanner] = useState("");

  const isSelf = normalizeId(me?.id || me?._id) === normalizeId(id);
  const canRequestChat = me?.role === "student" && payload.user?.role === "student" && !isSelf;

  function normalizeId(value) {
    if (!value) return "";
    if (typeof value === "string") return value;
    if (typeof value === "object") return value._id ? String(value._id) : "";
    return String(value);
  }

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get(`/user/public/${id}`);
      setPayload({
        user: res.data?.user || null,
        profile: res.data?.profile || null,
      });
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "Could not load profile"));
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadChatRequestStatus = useCallback(async () => {
    if (!canRequestChat) return;
    try {
      const res = await api.get(`/chat/request/status/${id}`);
      setChatRequestStatus(res.data?.status || "none");
      setChatRequestId(res.data?.request?._id || "");
    } catch (err) {
      setError(getErrorMessage(err, "Could not load chat request status"));
    }
  }, [canRequestChat, id]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  useEffect(() => {
    loadChatRequestStatus();
  }, [loadChatRequestStatus]);

  const title = useMemo(() => payload?.user?.name || "Profile", [payload]);
  const avatar = payload.profile?.profileImage || defaultAvatar(payload.user?.name);

  const sendChatRequest = async () => {
    try {
      setRequestLoading(true);
      setBanner("");
      await api.post(`/chat/request/${id}`, {
        note: "I'd like to connect and discuss academics/career.",
      });
      setBanner("Chat request sent.");
      await loadChatRequestStatus();
    } catch (err) {
      setBanner(getErrorMessage(err, "Could not send chat request"));
    } finally {
      setRequestLoading(false);
    }
  };

  const respondIncoming = async (action) => {
    if (!chatRequestId) return;
    try {
      setRequestLoading(true);
      setBanner("");
      await api.post(`/chat/request/${chatRequestId}/respond`, { action });
      setBanner(action === "accepted" ? "Chat request accepted." : "Chat request rejected.");
      await loadChatRequestStatus();
      if (action === "accepted") {
        navigate("/chat");
      }
    } catch (err) {
      setBanner(getErrorMessage(err, "Failed to update request"));
    } finally {
      setRequestLoading(false);
    }
  };

  const cancelOutgoing = async () => {
    if (!chatRequestId) return;
    try {
      setRequestLoading(true);
      setBanner("");
      await api.post(`/chat/request/${chatRequestId}/cancel`);
      setBanner("Chat request cancelled.");
      await loadChatRequestStatus();
    } catch (err) {
      setBanner(getErrorMessage(err, "Failed to cancel request"));
    } finally {
      setRequestLoading(false);
    }
  };

  const removeRequestRecord = async () => {
    if (!chatRequestId) return;
    try {
      setRequestLoading(true);
      setBanner("");
      await api.delete(`/chat/request/${chatRequestId}`);
      setBanner("Request removed.");
      await loadChatRequestStatus();
    } catch (err) {
      setBanner(getErrorMessage(err, "Failed to remove request"));
    } finally {
      setRequestLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4">
      <div className="max-w-5xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center gap-2 text-sm px-3 py-2 rounded-lg border border-slate-300 hover:bg-white mb-4"
        >
          <FiArrowLeft size={14} /> Back
        </button>

        {loading && <p className="text-sm text-slate-500">Loading profile...</p>}
        {!loading && error && <p className="text-sm text-red-600">{error}</p>}

        {!loading && !error && payload.user && (
          <div className="grid lg:grid-cols-[320px,1fr] gap-4">
            <aside className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm h-fit">
              <img
                src={avatar}
                alt="Profile"
                className="h-28 w-28 rounded-full object-cover border border-slate-200 mx-auto"
                onError={(e) => {
                  e.currentTarget.src = defaultAvatar(payload.user?.name);
                }}
              />
              <h1 className="text-xl font-bold text-center mt-3">{title}</h1>
              <p className="text-sm text-slate-500 text-center capitalize">{payload.user.role}</p>
              <p className="text-xs text-slate-500 text-center mt-1">{payload.user.prn || payload.user.email}</p>

              <div className="mt-4 space-y-2">
                {!isSelf && !canRequestChat && (
                  <button
                    onClick={() =>
                      navigate("/chat", {
                        state: {
                          chatTarget: {
                            _id: payload.user?._id,
                            name: payload.user?.name,
                            email: payload.user?.email,
                            prn: payload.user?.prn,
                          },
                        },
                      })
                    }
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm"
                  >
                    <FiMessageSquare size={14} /> Private Chat
                  </button>
                )}

                {canRequestChat && ["none", "rejected", "cancelled"].includes(chatRequestStatus) && (
                  <button
                    onClick={sendChatRequest}
                    disabled={requestLoading}
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:bg-blue-300"
                  >
                    <FiMessageSquare size={14} /> {requestLoading ? "Sending..." : "Request To Message"}
                  </button>
                )}
                {canRequestChat && chatRequestStatus === "pending_outgoing" && (
                  <div className="space-y-2">
                    <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded p-2">
                      Request pending. Wait for acceptance.
                    </p>
                    <button
                      onClick={cancelOutgoing}
                      disabled={requestLoading}
                      className="w-full text-xs px-2 py-2 rounded border border-amber-300 text-amber-700"
                    >
                      Cancel Request
                    </button>
                  </div>
                )}
                {canRequestChat && chatRequestStatus === "pending_incoming" && (
                  <div className="space-y-2">
                    <p className="text-xs text-slate-600">This user requested to message you.</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => respondIncoming("accepted")}
                        disabled={requestLoading}
                        className="flex-1 text-xs px-2 py-2 rounded bg-emerald-600 text-white"
                      >
                        Accept
                      </button>
                      <button
                        onClick={() => respondIncoming("rejected")}
                        disabled={requestLoading}
                        className="flex-1 text-xs px-2 py-2 rounded border border-red-300 text-red-600"
                      >
                        Reject
                      </button>
                    </div>
                  </div>
                )}
                {canRequestChat && chatRequestStatus === "accepted" && (
                  <button
                    onClick={() => navigate("/chat")}
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm"
                  >
                    <FiMessageSquare size={14} /> Open Chat
                  </button>
                )}
                {canRequestChat && ["rejected", "cancelled"].includes(chatRequestStatus) && (
                  <button
                    onClick={removeRequestRecord}
                    disabled={requestLoading}
                    className="w-full text-xs px-2 py-2 rounded border border-slate-300 text-slate-700"
                  >
                    Remove Old Request
                  </button>
                )}
                {banner && (
                  <p className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded p-2">{banner}</p>
                )}
              </div>
            </aside>

            <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div>
                <h2 className="text-lg font-semibold mb-2">About</h2>
                <p className="text-sm text-slate-700">{payload.profile?.bio || payload.profile?.headline || "-"}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-3 text-sm">
                <p><span className="font-medium">Branch:</span> {listOrDash(payload.profile?.branch)}</p>
                <p><span className="font-medium">Year Of Study:</span> {listOrDash(payload.profile?.yearOfStudy)}</p>
                <p><span className="font-medium">Graduation Year:</span> {listOrDash(payload.profile?.graduationYear)}</p>
                <p className="inline-flex items-center gap-2">
                  <FaMapMarkerAlt className="text-slate-500" />
                  {listOrDash(payload.profile?.location)}
                </p>
                <p><span className="font-medium">Skills:</span> {listOrDash(payload.profile?.skills)}</p>
                <p><span className="font-medium">Interests:</span> {listOrDash(payload.profile?.interests)}</p>
                {payload.user?.role === "alumni" && (
                  <>
                    <p><span className="font-medium">Company:</span> {listOrDash(payload.profile?.currentCompany)}</p>
                    <p><span className="font-medium">Job Title:</span> {listOrDash(payload.profile?.jobTitle)}</p>
                  </>
                )}
              </div>

              <div className="pt-2 border-t border-slate-200">
                <h3 className="text-sm font-semibold mb-2">Social</h3>
                <div className="flex flex-wrap gap-2">
                  {payload.profile?.linkedIn && (
                    <a
                      href={payload.profile.linkedIn}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-slate-300 text-sm hover:bg-slate-50"
                    >
                      <FaLinkedin className="text-blue-700" /> LinkedIn
                    </a>
                  )}
                  {payload.profile?.github && (
                    <a
                      href={payload.profile.github}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-slate-300 text-sm hover:bg-slate-50"
                    >
                      <FaGithub /> GitHub
                    </a>
                  )}
                  {payload.profile?.portfolio && (
                    <a
                      href={payload.profile.portfolio}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-slate-300 text-sm hover:bg-slate-50"
                    >
                      <FiUser size={14} /> Portfolio
                    </a>
                  )}
                  {!payload.profile?.linkedIn && !payload.profile?.github && !payload.profile?.portfolio && (
                    <p className="text-sm text-slate-500">No social links available.</p>
                  )}
                </div>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
