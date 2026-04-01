import React, { useEffect, useMemo, useState } from "react";
import { FiSend } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import api from "../utils/axiosInstance";

export default function AlumniDirectory() {
  const { user } = useAuth();
  const [alumni, setAlumni] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [feedback, setFeedback] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isStudent = user?.role === "student";

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/alumni/verified");
        setAlumni(res.data?.alumni || []);
      } catch (err) {
        setError(err.response?.data?.msg || "Failed to load alumni list");
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return alumni;
    return alumni
      .map((a) => {
        const name = a.name?.toLowerCase() || "";
        const email = a.email?.toLowerCase() || "";
        const prn = a.prn?.toLowerCase() || "";
        let score = 0;
        if (name.startsWith(q)) score += 6;
        if (name.includes(q)) score += 4;
        if (prn.startsWith(q)) score += 5;
        if (prn.includes(q)) score += 3;
        if (email.includes(q)) score += 2;
        return { item: a, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.item);
  }, [alumni, search]);

  const sendMentorshipRequest = async () => {
    if (!selected?._id || !requestMessage.trim()) {
      setFeedback({ type: "error", text: "Please choose alumni and enter message." });
      return;
    }

    setLoading(true);
    setFeedback({ type: "", text: "" });

    try {
      await api.post("/mentorship/request", {
        alumniId: selected._id,
        message: requestMessage.trim(),
      });

      setFeedback({ type: "success", text: "Mentorship request sent successfully." });
      setRequestMessage("");
    } catch (err) {
      setFeedback({
        type: "error",
        text: err.response?.data?.msg || "Failed to send mentorship request",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 grid md:grid-cols-3 gap-4">
      <section className="md:col-span-2 bg-white border rounded-lg p-4">
        <div className="flex justify-between items-center mb-3 gap-2">
          <h2 className="text-xl font-semibold">Alumni Directory</h2>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded px-3 py-2"
            placeholder="Search by name / PRN / email"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2">Name</th>
                <th className="py-2">PRN</th>
                <th className="py-2">Email</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => (
                <tr
                  key={a._id}
                  className="border-b hover:bg-slate-50 cursor-pointer"
                  onClick={() => setSelected(a)}
                >
                  <td className="py-2">{a.name}</td>
                  <td className="py-2">{a.prn || "-"}</td>
                  <td className="py-2">{a.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="text-slate-500 mt-3">No alumni found.</p>}
        </div>
      </section>

      <aside className="bg-white border rounded-lg p-4 space-y-3">
        <h3 className="font-semibold">Alumni Details</h3>
        {!selected && <p className="text-sm text-slate-500">Select a row to view details.</p>}
        {selected && (
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Name:</span> {selected.name}</p>
            <p><span className="font-medium">PRN:</span> {selected.prn || "-"}</p>
            <p><span className="font-medium">Email:</span> {selected.email}</p>
            <p><span className="font-medium">Role:</span> {selected.role}</p>
          </div>
        )}

        {isStudent && selected && (
          <div className="pt-3 border-t space-y-2">
            <p className="text-sm font-medium text-slate-800">Request Mentorship</p>
            <textarea
              value={requestMessage}
              onChange={(e) => setRequestMessage(e.target.value)}
              className="w-full border rounded px-3 py-2 text-sm"
              rows={4}
              placeholder="Write why you want mentorship..."
            />
            <button
              onClick={sendMentorshipRequest}
              disabled={loading}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 rounded bg-blue-600 text-white text-sm disabled:bg-blue-300"
            >
              <FiSend size={14} /> {loading ? "Sending..." : "Send Request"}
            </button>
          </div>
        )}

        {feedback.text && (
          <p className={`text-xs ${feedback.type === "error" ? "text-red-600" : "text-green-600"}`}>
            {feedback.text}
          </p>
        )}
        {error && <p className="text-red-600 text-xs mt-3">{error}</p>}
      </aside>
    </div>
  );
}
