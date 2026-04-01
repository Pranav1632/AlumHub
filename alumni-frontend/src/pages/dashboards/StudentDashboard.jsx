import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { FiCalendar, FiMessageSquare, FiRefreshCw, FiUsers } from "react-icons/fi";
import api from "../../utils/axiosInstance";
import { useAuth } from "../../context/AuthContext";

const badgeClassByStatus = {
  pending: "bg-amber-100 text-amber-800",
  accepted: "bg-emerald-100 text-emerald-800",
  rejected: "bg-red-100 text-red-800",
  completed: "bg-blue-100 text-blue-800",
};

export default function StudentDashboard() {
  const { user } = useAuth();
  const [eventsCount, setEventsCount] = useState(0);
  const [alumniCount, setAlumniCount] = useState(0);
  const [requests, setRequests] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = async (showRefreshing = false) => {
    try {
      if (showRefreshing) setRefreshing(true);
      const [eventsRes, alumniRes, mentorshipRes] = await Promise.all([
        api.get("/events"),
        api.get("/alumni/verified"),
        api.get("/mentorship/my"),
      ]);

      setEventsCount(eventsRes.data?.count || 0);
      setAlumniCount(alumniRes.data?.count || 0);
      setRequests(mentorshipRes.data?.requests || []);
    } catch {
      setEventsCount(0);
      setAlumniCount(0);
      setRequests([]);
    } finally {
      if (showRefreshing) setRefreshing(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      load(false);
    }, 20000);
    return () => clearInterval(interval);
  }, []);

  const mentorshipCount = requests.length;
  const latestRequests = useMemo(() => requests.slice(0, 3), [requests]);

  return (
    <div className="max-w-6xl mx-auto py-8 px-2">
      <h1 className="text-3xl font-bold text-slate-900">Student Dashboard</h1>
      <p className="text-slate-500 mt-1">Welcome {user?.name} | College: {user?.collegeId}</p>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-sm text-slate-500">Verified Alumni</p>
          <p className="text-3xl font-semibold text-slate-900 mt-1">{alumniCount}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-sm text-slate-500">Upcoming Events</p>
          <p className="text-3xl font-semibold text-slate-900 mt-1">{eventsCount}</p>
        </div>
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm">
          <p className="text-sm text-slate-500">My Mentorship Requests</p>
          <p className="text-3xl font-semibold text-slate-900 mt-1">{mentorshipCount}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4 mt-6">
        <Link to="/alumni-directory" className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl p-4 flex items-center justify-between">
          <span className="font-medium">Explore Alumni & Request Mentorship</span>
          <FiUsers size={18} />
        </Link>
        <Link to="/chat" className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl p-4 flex items-center justify-between">
          <span className="font-medium">Open Private Chat</span>
          <FiMessageSquare size={18} />
        </Link>
        <Link to="/discussion" className="bg-slate-800 hover:bg-slate-900 text-white rounded-xl p-4 flex items-center justify-between">
          <span className="font-medium">Community Discussion</span>
          <FiMessageSquare size={18} />
        </Link>
        <Link to="/events" className="bg-amber-600 hover:bg-amber-700 text-white rounded-xl p-4 flex items-center justify-between">
          <span className="font-medium">View Events Calendar</span>
          <FiCalendar size={18} />
        </Link>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm mt-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h3 className="font-semibold text-slate-800">My Recent Mentorship Requests</h3>
          <button
            onClick={() => load(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md border border-slate-300 text-slate-700 text-sm hover:bg-slate-50 disabled:opacity-60"
          >
            <FiRefreshCw size={14} /> {refreshing ? "Refreshing..." : "Refresh Requests"}
          </button>
        </div>
        {latestRequests.length === 0 && <p className="text-sm text-slate-500">No mentorship requests yet.</p>}

        <div className="space-y-3">
          {latestRequests.map((req) => {
            const status = req.status || "pending";
            const statusClass = badgeClassByStatus[status] || "bg-slate-100 text-slate-700";
            return (
              <div key={req._id} className="border rounded-lg p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-medium text-slate-900">
                    Alumni: {req.alumniId?.name || "Unknown"}
                  </p>
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${statusClass}`}>
                    {status.toUpperCase()}
                  </span>
                </div>
                <p className="text-sm text-slate-500">PRN: {req.alumniId?.prn || "N/A"} | Email: {req.alumniId?.email || "N/A"}</p>
                <p className="text-sm text-slate-700 mt-1">Message: {req.message}</p>
                <p className="text-xs text-slate-500 mt-1">Requested on: {new Date(req.createdAt).toLocaleString()}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
