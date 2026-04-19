import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiAlertTriangle, FiCalendar, FiCheckCircle, FiMessageSquare, FiRefreshCw, FiUser, FiXCircle } from "react-icons/fi";
import api from "../../utils/axiosInstance";
import { useAuth } from "../../context/AuthContext";

const badgeClassByStatus = {
  pending: "bg-amber-100 text-amber-800",
  accepted: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  completed: "bg-blue-100 text-blue-800",
};

export default function AlumniDashboard() {
  const { user } = useAuth();
  const [me, setMe] = useState(null);
  const [requests, setRequests] = useState([]);
  const [events, setEvents] = useState([]);
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      const [meRes, reqRes, eventsRes] = await Promise.all([
        api.get("/user/me"),
        api.get("/mentorship/my"),
        api.get("/events"),
      ]);
      setMe(meRes.data);
      setRequests(reqRes.data?.requests || []);
      setEvents(eventsRes.data?.events || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to load dashboard data");
      setMe(null);
      setRequests([]);
      setEvents([]);
    } finally {
      if (showRefreshing) setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      loadData(false);
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  const acceptRequest = async (requestId) => {
    try {
      setActionLoadingId(requestId);
      await api.post(`/mentorship/${requestId}/accept`, {
        expertise: "General guidance",
        availability: "Weekends",
        mode: "online",
        termsAccepted: true,
      });
      await loadData();
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to accept mentorship request");
    } finally {
      setActionLoadingId("");
    }
  };

  const rejectRequest = async (requestId) => {
    try {
      setActionLoadingId(requestId);
      await api.post(`/mentorship/${requestId}/reject`, {
        reason: "Currently unavailable",
      });
      await loadData();
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to reject mentorship request");
    } finally {
      setActionLoadingId("");
    }
  };

  const pendingRequests = useMemo(() => requests.filter((req) => req.status === "pending"), [requests]);
  const featuredEvents = useMemo(() => {
    if (events.length > 0) {
      return events
        .slice()
        .sort((a, b) => new Date(a.date) - new Date(b.date))
        .slice(0, 4);
    }
    return [
      {
        _id: "sample-event-1",
        title: "Alumni-Student Career Talk",
        date: new Date().toISOString(),
        time: "6:00 PM",
        venue: "Main Auditorium",
      },
      {
        _id: "sample-event-2",
        title: "Industry Networking Evening",
        date: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(),
        time: "5:30 PM",
        venue: "Innovation Hall",
      },
      {
        _id: "sample-event-3",
        title: "Resume & Interview Sprint",
        date: new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString(),
        time: "11:00 AM",
        venue: "Placement Cell",
      },
    ];
  }, [events]);

  const profileCompletionPercent = me?.profileCompletion?.completionPercent || 0;

  return (
    <div className="max-w-6xl mx-auto py-6 sm:py-8 px-2">
      <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Alumni Dashboard</h1>
      <p className="text-slate-500 mt-1 text-sm sm:text-base break-words">Welcome {user?.name} | College: {user?.collegeId}</p>
      {me?.profileCompletion && !me.profileCompletion.isComplete && (
        <div className="mt-3 inline-flex w-full items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-amber-900 text-sm">
          <FiAlertTriangle className="mt-0.5 shrink-0" size={15} />
          <span>
            Profile {me.profileCompletion.completionPercent || 0}% complete. Missing: {(me.profileCompletion.missingFields || []).slice(0, 5).join(", ")}
          </span>
        </div>
      )}
      {me?.profileCompletion && (
        <div className="mt-3 rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center justify-between gap-2 text-sm">
            <p className="font-medium text-slate-800">Profile Completion</p>
            <p className="text-slate-600">{profileCompletionPercent}%</p>
          </div>
          <div className="mt-2 h-2 w-full rounded-full bg-slate-100">
            <div
              className={`h-full rounded-full ${me.profileCompletion.isComplete ? "bg-emerald-500" : "bg-amber-500"}`}
              style={{ width: `${profileCompletionPercent}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-3 sm:gap-4 mt-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-3">Profile Snapshot</h2>
          <div className="space-y-1 text-sm text-slate-700">
            <p><span className="font-medium">Name:</span> {me?.user?.name || "-"}</p>
            <p><span className="font-medium">Email:</span> {me?.user?.email || "-"}</p>
            <p><span className="font-medium">PRN:</span> {me?.user?.prn || "-"}</p>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <h2 className="font-semibold text-slate-800 mb-3">Mentorship Requests</h2>
          <p className="text-3xl font-semibold text-slate-900">{requests.length}</p>
          <p className="text-sm text-slate-500 mt-1">Pending requests: {pendingRequests.length}</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-2 gap-3 sm:gap-4 mt-6">
        <div className="relative overflow-hidden rounded-2xl border border-sky-800 bg-gradient-to-br from-[#0c2d53] via-[#114075] to-[#1f5e9c] p-5 text-white shadow-md">
          <div className="absolute right-0 top-0 h-24 w-24 rounded-full bg-sky-400/20 blur-2xl pointer-events-none" />
          <h3 className="text-lg font-semibold">College Highlights</h3>
          <p className="text-sm text-blue-100 mt-1">Keep campus and alumni community active every week.</p>
          <div className="mt-4 space-y-2">
            <div className="rounded-lg border border-white/20 bg-white/10 p-2">
              <p className="text-sm font-medium">Placement Mentorship Drive</p>
              <p className="text-xs text-blue-100">Connect with final-year students for interview readiness.</p>
            </div>
            <div className="rounded-lg border border-white/20 bg-white/10 p-2">
              <p className="text-sm font-medium">Department Collaboration Cells</p>
              <p className="text-xs text-blue-100">Cross-branch project reviews and technical support circles.</p>
            </div>
            <div className="rounded-lg border border-white/20 bg-white/10 p-2">
              <p className="text-sm font-medium">Startup & Innovation Desk</p>
              <p className="text-xs text-blue-100">Help student founders with MVP and pitch feedback.</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-indigo-100 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-lg font-semibold text-slate-800">Upcoming College Events</h3>
            <span className="text-[11px] uppercase tracking-wide text-indigo-700 bg-indigo-100 px-2 py-1 rounded-full">
              Active
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {featuredEvents.map((event) => (
              <div key={event._id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                <p className="text-sm font-medium text-slate-800">{event.title}</p>
                <p className="text-xs text-slate-600 mt-0.5">
                  {new Date(event.date).toLocaleDateString()} {event.time ? `| ${event.time}` : ""} | {event.venue || "Campus"}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mt-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 className="font-semibold text-slate-800">Mentorship Requests With Details</h3>
          <button
            onClick={() => loadData(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 text-sm hover:bg-slate-50 disabled:opacity-60"
          >
            <FiRefreshCw size={14} /> {refreshing ? "Refreshing..." : "Refresh Requests"}
          </button>
        </div>
        {requests.length === 0 && <p className="text-sm text-slate-500">No requests yet.</p>}

        <div className="space-y-3">
          {requests.map((req) => {
            const status = req.status || "pending";
            const statusClass = badgeClassByStatus[status] || "bg-slate-100 text-slate-700";
            const fromLabel = req.requestedByRole === "student" ? "Student" : "Admin";
            const canAct = status === "pending";

            return (
              <div key={req._id} className="border rounded-lg p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-slate-900">
                    From {fromLabel}: {req.requestedBy?.name || req.studentId?.name || "Unknown"}
                  </p>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusClass}`}>
                    {status.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-slate-500">
                  PRN: {req.studentId?.prn || req.requestedBy?.prn || "N/A"} | Email: {req.studentId?.email || req.requestedBy?.email || "N/A"}
                </p>
                <p className="text-sm text-slate-700 mt-1">Message: {req.message}</p>
                <p className="text-xs text-slate-500 mt-1">Requested on: {new Date(req.createdAt).toLocaleString()}</p>

                {canAct && (
                  <div className="flex items-center gap-2 mt-3">
                    <button
                      onClick={() => acceptRequest(req._id)}
                      disabled={actionLoadingId === req._id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded bg-emerald-600 text-white text-sm disabled:bg-emerald-300"
                    >
                      <FiCheckCircle size={14} /> Accept
                    </button>
                    <button
                      onClick={() => rejectRequest(req._id)}
                      disabled={actionLoadingId === req._id}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-red-300 text-red-600 text-sm disabled:opacity-60"
                    >
                      <FiXCircle size={14} /> Reject
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-4 mt-6">
        <Link to="/profile" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-4 flex items-center justify-between">
          <span className="font-medium">Edit Profile</span>
          <FiUser size={18} />
        </Link>
        <Link to="/chat" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl p-4 flex items-center justify-between">
          <span className="font-medium">Private Chat</span>
          <FiMessageSquare size={18} />
        </Link>
        <Link to="/events" className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl p-4 flex items-center justify-between">
          <span className="font-medium">Events</span>
          <FiCalendar size={18} />
        </Link>
      </div>

      {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
    </div>
  );
}
