import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiCalendar, FiCheckCircle, FiMessageSquare, FiRefreshCw, FiUser, FiXCircle } from "react-icons/fi";
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
  const [error, setError] = useState("");
  const [actionLoadingId, setActionLoadingId] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      const [meRes, reqRes] = await Promise.all([api.get("/user/me"), api.get("/mentorship/my")]);
      setMe(meRes.data);
      setRequests(reqRes.data?.requests || []);
      setError("");
    } catch (err) {
      setError(err.response?.data?.msg || "Failed to load dashboard data");
      setMe(null);
      setRequests([]);
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

  return (
    <div className="max-w-6xl mx-auto py-8 px-2">
      <h1 className="text-3xl font-bold text-slate-900">Alumni Dashboard</h1>
      <p className="text-slate-500 mt-1">Welcome {user?.name} | College: {user?.collegeId}</p>

      <div className="grid lg:grid-cols-2 gap-4 mt-6">
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
