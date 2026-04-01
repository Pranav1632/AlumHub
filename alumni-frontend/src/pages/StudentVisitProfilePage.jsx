import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../utils/axiosInstance";
import { getErrorMessage } from "../utils/errorUtils";

const listOrDash = (value) => {
  if (Array.isArray(value) && value.length > 0) return value.join(", ");
  if (typeof value === "string" && value.trim()) return value;
  return "-";
};

export default function StudentVisitProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [payload, setPayload] = useState({ user: null, profile: null });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await api.get(`/user/visit/student/${id}`);
        setPayload({
          user: res.data?.user || null,
          profile: res.data?.profile || null,
        });
        setError("");
      } catch (err) {
        setError(getErrorMessage(err, "Could not load student profile"));
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id]);

  const title = useMemo(() => payload?.user?.name || "Student Profile", [payload]);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => navigate("/chat")}
            className="px-3 py-2 rounded border border-slate-300 text-sm hover:bg-slate-100"
          >
            Back to Chat
          </button>
        </div>
      </div>

      {loading && <p className="text-sm text-slate-500">Loading profile...</p>}
      {!loading && error && <p className="text-sm text-red-600">{error}</p>}

      {!loading && !error && payload.user && (
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-3">
          <p><span className="font-medium">Name:</span> {payload.user.name}</p>
          <p><span className="font-medium">PRN:</span> {payload.user.prn || "-"}</p>
          <p><span className="font-medium">Email:</span> {payload.user.email}</p>
          <p><span className="font-medium">Branch:</span> {listOrDash(payload.profile?.branch)}</p>
          <p><span className="font-medium">Year Of Study:</span> {listOrDash(payload.profile?.yearOfStudy)}</p>
          <p><span className="font-medium">Graduation Year:</span> {listOrDash(payload.profile?.graduationYear)}</p>
          <p><span className="font-medium">Interests:</span> {listOrDash(payload.profile?.interests)}</p>
          <p><span className="font-medium">Skills:</span> {listOrDash(payload.profile?.skills)}</p>
        </div>
      )}
    </div>
  );
}

