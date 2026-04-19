import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FaGithub, FaLinkedin, FaMapMarkerAlt } from "react-icons/fa";
import { FiArrowLeft, FiMessageSquare, FiSend, FiUser } from "react-icons/fi";
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

const normalizeId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") return value._id ? String(value._id) : "";
  return String(value);
};

export default function PublicProfileVisitPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user: me } = useAuth();

  const [payload, setPayload] = useState({ user: null, profile: null });
  const [requestMessage, setRequestMessage] = useState(
    "I would like mentorship guidance on academics/career planning."
  );
  const [requestLoading, setRequestLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [banner, setBanner] = useState("");

  const isSelf = normalizeId(me?.id || me?._id) === normalizeId(id);
  const isStudentToAlumniFlow = me?.role === "student" && payload.user?.role === "alumni" && !isSelf;
  const isAlumniToStudentFlow = me?.role === "alumni" && payload.user?.role === "student" && !isSelf;
  const allowPrivateChat = !isSelf && !isStudentToAlumniFlow && !isAlumniToStudentFlow;

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

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const title = useMemo(() => payload?.user?.name || "Profile", [payload]);
  const avatar = payload.profile?.profileImage || defaultAvatar(payload.user?.name);
  const chatTarget = useMemo(() => {
    if (!payload.user?._id) return null;
    return {
      _id: payload.user._id,
      name: payload.user.name,
      email: payload.user.email,
      prn: payload.user.prn,
    };
  }, [payload.user]);

  const openChatWithTarget = () => {
    if (!chatTarget?._id) return;
    navigate("/chat", {
      state: { chatTarget },
    });
  };

  const sendMentorshipRequest = async () => {
    if (!requestMessage.trim()) {
      setBanner("Please add a short mentorship message.");
      return;
    }

    try {
      setRequestLoading(true);
      setBanner("");
      await api.post("/mentorship/request", {
        alumniId: id,
        message: requestMessage.trim(),
      });
      setBanner("Mentorship request sent. Alumni can review it in their dashboard.");
    } catch (err) {
      setBanner(getErrorMessage(err, "Could not send mentorship request"));
    } finally {
      setRequestLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-4 sm:py-6 px-2 sm:px-4">
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
          <div className="grid lg:grid-cols-[320px,1fr] gap-3 sm:gap-4">
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
                {allowPrivateChat && (
                  <button
                    onClick={openChatWithTarget}
                    className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm"
                  >
                    <FiMessageSquare size={14} /> Private Chat
                  </button>
                )}

                {isStudentToAlumniFlow && (
                  <div className="space-y-2 rounded-lg border border-blue-200 bg-blue-50 p-3">
                    <p className="text-xs text-blue-900 font-medium">
                      Send mentorship request (this appears on Alumni Dashboard).
                    </p>
                    <textarea
                      rows={3}
                      value={requestMessage}
                      onChange={(e) => setRequestMessage(e.target.value)}
                      className="w-full rounded border border-blue-200 px-2 py-1.5 text-sm"
                      placeholder="Write why you are requesting mentorship..."
                    />
                    <button
                      onClick={sendMentorshipRequest}
                      disabled={requestLoading}
                      className="w-full inline-flex items-center justify-center gap-2 rounded bg-blue-600 px-3 py-2 text-sm text-white disabled:bg-blue-300"
                    >
                      <FiSend size={14} /> {requestLoading ? "Sending..." : "Request Mentorship"}
                    </button>
                  </div>
                )}

                {isAlumniToStudentFlow && (
                  <p className="text-xs text-slate-700 bg-slate-50 border border-slate-200 rounded p-2">
                    Student-alumni requests are managed through mentorship dashboard flow.
                  </p>
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
