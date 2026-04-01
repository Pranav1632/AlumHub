import React, { useEffect, useState } from "react";
import { FiCheckCircle, FiUserX } from "react-icons/fi";
import api from "../../utils/axiosInstance";
import { useAuth } from "../../context/AuthContext";

export default function CollegeDashboard() {
  const { user } = useAuth();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [error, setError] = useState("");

  const loadPending = async () => {
    try {
      const res = await api.get("/admin/pending");
      setPendingUsers(res.data?.users || []);
    } catch (err) {
      setError(err.response?.data?.msg || "Unable to load pending users");
    }
  };

  useEffect(() => {
    loadPending();
  }, []);

  const verify = async (id) => {
    try {
      await api.put(`/admin/verify/${id}`);
      await loadPending();
    } catch (err) {
      setError(err.response?.data?.msg || "Verification failed");
    }
  };

  const block = async (id) => {
    try {
      await api.put(`/admin/block/${id}`);
      await loadPending();
    } catch (err) {
      setError(err.response?.data?.msg || "Block failed");
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-2">
      <h1 className="text-3xl font-bold text-slate-900">Admin Dashboard</h1>
      <p className="text-slate-500 mt-1">{user?.name} | College: {user?.collegeId}</p>

      <div className="bg-white rounded-xl border border-slate-200 p-5 mt-6 shadow-sm">
        <h2 className="font-semibold text-slate-800 mb-3">Pending Verification Requests</h2>
        {pendingUsers.length === 0 && <p className="text-slate-500">No pending users right now.</p>}

        <ul className="space-y-3">
          {pendingUsers.map((u) => (
            <li key={u._id} className="flex flex-col sm:flex-row sm:items-center justify-between border rounded-lg p-3 gap-3">
              <div>
                <p className="font-medium text-slate-900">{u.name}</p>
                <p className="text-sm text-slate-500">{u.role} | {u.prn || u.email}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => verify(u._id)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-sm">
                  <FiCheckCircle size={14} /> Verify
                </button>
                <button onClick={() => block(u._id)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-red-300 text-red-600 text-sm">
                  <FiUserX size={14} /> Block
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {error && <p className="text-red-600 text-sm mt-3">{error}</p>}
    </div>
  );
}