import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiAward, FiBriefcase, FiClock, FiFilter, FiSend, FiStar, FiTrendingUp, FiUsers } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import api from "../utils/axiosInstance";

const CATEGORY_META = {
  all: {
    label: "All Alumni",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    icon: FiUsers,
  },
  most_active: {
    label: "Most Active",
    badgeClass: "bg-emerald-100 text-emerald-800 border-emerald-200",
    icon: FiStar,
  },
  recent_passouts: {
    label: "Recent Pass-outs",
    badgeClass: "bg-blue-100 text-blue-800 border-blue-200",
    icon: FiClock,
  },
  industry_mentors: {
    label: "Industry Mentors",
    badgeClass: "bg-cyan-100 text-cyan-800 border-cyan-200",
    icon: FiBriefcase,
  },
  rising_mentors: {
    label: "Rising Mentors",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-200",
    icon: FiTrendingUp,
  },
  others: {
    label: "Others",
    badgeClass: "bg-slate-100 text-slate-700 border-slate-200",
    icon: FiAward,
  },
};

const toYear = (value) => {
  const year = Number.parseInt(String(value || "").trim(), 10);
  if (Number.isNaN(year)) return null;
  if (year < 1980 || year > 2100) return null;
  return year;
};

const normalizeText = (value) => String(value || "").trim();

const getActivityScore = (alumni) => {
  const profile = alumni.profile || {};
  const now = Date.now();
  const lastLoginAt = alumni.lastLoginAt ? new Date(alumni.lastLoginAt).getTime() : 0;
  const daysSinceLogin = lastLoginAt ? Math.floor((now - lastLoginAt) / (24 * 60 * 60 * 1000)) : 180;
  const loginRecencyScore = Math.max(0, 28 - Math.min(daysSinceLogin, 28));

  const profileDepth = [
    profile.headline,
    profile.bio,
    profile.location,
    profile.currentCompany,
    profile.jobTitle,
    profile.linkedIn,
    profile.github,
    profile.portfolio,
  ].filter((item) => normalizeText(item)).length;

  const skillsCount = Array.isArray(profile.skills) ? profile.skills.filter((skill) => normalizeText(skill)).length : 0;
  const interestsCount = Array.isArray(profile.interests) ? profile.interests.filter((item) => normalizeText(item)).length : 0;

  return loginRecencyScore + profileDepth * 3 + Math.min(skillsCount, 6) * 2 + Math.min(interestsCount, 4);
};

const getCategoryKey = ({ alumni, mostActiveIds, currentYear }) => {
  const profile = alumni.profile || {};
  const graduationYear = toYear(profile.graduationYear);

  if (mostActiveIds.has(String(alumni._id))) return "most_active";
  if (graduationYear && graduationYear >= currentYear - 2) return "recent_passouts";
  if (normalizeText(profile.currentCompany) && normalizeText(profile.jobTitle)) return "industry_mentors";
  if ((alumni.activityScore || 0) >= 30) return "rising_mentors";
  return "others";
};

export default function AlumniDirectory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [alumni, setAlumni] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [requestMessage, setRequestMessage] = useState("");
  const [feedback, setFeedback] = useState({ type: "", text: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");

  const isStudent = user?.role === "student";
  const currentYear = new Date().getFullYear();

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

  const categorizedAlumni = useMemo(() => {
    const withScores = (alumni || []).map((item) => ({
      ...item,
      activityScore: getActivityScore(item),
    }));

    const mostActiveIds = new Set(
      withScores
        .slice()
        .sort((a, b) => b.activityScore - a.activityScore)
        .slice(0, 6)
        .map((item) => String(item._id))
    );

    return withScores.map((item) => {
      const categoryKey = getCategoryKey({ alumni: item, mostActiveIds, currentYear });
      return {
        ...item,
        categoryKey,
      };
    });
  }, [alumni, currentYear]);

  const countsByCategory = useMemo(() => {
    const counts = { all: categorizedAlumni.length };
    categorizedAlumni.forEach((item) => {
      counts[item.categoryKey] = (counts[item.categoryKey] || 0) + 1;
    });
    return counts;
  }, [categorizedAlumni]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return categorizedAlumni
      .filter((item) => activeCategory === "all" || item.categoryKey === activeCategory)
      .map((item) => {
        if (!q) return { item, score: item.activityScore + 4 };

        const profile = item.profile || {};
        const candidate = [
          item.name,
          item.email,
          item.prn,
          profile.currentCompany,
          profile.jobTitle,
          profile.branch,
          profile.graduationYear,
          ...(Array.isArray(profile.skills) ? profile.skills : []),
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!candidate.includes(q)) return { item, score: 0 };

        let score = item.activityScore;
        if (String(item.name || "").toLowerCase().startsWith(q)) score += 12;
        if (String(item.prn || "").toLowerCase().startsWith(q)) score += 10;
        if (String(item.email || "").toLowerCase().includes(q)) score += 6;
        return { item, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((entry) => entry.item);
  }, [categorizedAlumni, search, activeCategory]);

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
    <div className="max-w-7xl mx-auto p-4 grid lg:grid-cols-[1fr,340px] gap-4">
      <section className="bg-white border rounded-xl p-4">
        <div className="flex flex-wrap justify-between items-center mb-3 gap-2">
          <div>
            <h2 className="text-xl font-semibold">Alumni Directory</h2>
            <p className="text-sm text-slate-500">Admin-friendly categories with color tags for quick discovery.</p>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border rounded px-3 py-2 text-sm min-w-[230px]"
            placeholder="Search by name / PRN / skill / company"
          />
        </div>

        <div className="flex flex-wrap gap-2 mb-4">
          {Object.entries(CATEGORY_META).map(([key, meta]) => {
            const Icon = meta.icon;
            const isActive = key === activeCategory;
            return (
              <button
                key={key}
                onClick={() => setActiveCategory(key)}
                className={`inline-flex items-center gap-1.5 border rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  isActive
                    ? `${meta.badgeClass} ring-2 ring-offset-1 ring-slate-300`
                    : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                }`}
              >
                <Icon size={13} /> {meta.label} ({countsByCategory[key] || 0})
              </button>
            );
          })}
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b bg-slate-50">
                <th className="py-2 px-2">Name</th>
                <th className="py-2 px-2">PRN</th>
                <th className="py-2 px-2">Email</th>
                <th className="py-2 px-2">Graduation</th>
                <th className="py-2 px-2">Category</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((a) => {
                const profile = a.profile || {};
                const categoryMeta = CATEGORY_META[a.categoryKey] || CATEGORY_META.others;
                return (
                  <tr
                    key={a._id}
                    className="border-b hover:bg-slate-50 cursor-pointer"
                    onClick={() => setSelected(a)}
                  >
                    <td className="py-2 px-2 font-medium">{a.name}</td>
                    <td className="py-2 px-2">{a.prn || "-"}</td>
                    <td className="py-2 px-2">{a.email}</td>
                    <td className="py-2 px-2">{profile.graduationYear || "-"}</td>
                    <td className="py-2 px-2">
                      <span className={`inline-flex border rounded-full px-2 py-0.5 text-[11px] ${categoryMeta.badgeClass}`}>
                        {categoryMeta.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && <p className="text-slate-500 text-sm p-3">No alumni found for this category/search.</p>}
        </div>
      </section>

      <aside className="bg-white border rounded-xl p-4 space-y-3">
        <h3 className="font-semibold">Alumni Details</h3>
        {!selected && <p className="text-sm text-slate-500">Select a row to view details.</p>}
        {selected && (
          <div className="space-y-2 text-sm">
            <p><span className="font-medium">Name:</span> {selected.name}</p>
            <p><span className="font-medium">PRN:</span> {selected.prn || "-"}</p>
            <p><span className="font-medium">Email:</span> {selected.email}</p>
            <p><span className="font-medium">Branch:</span> {selected.profile?.branch || "-"}</p>
            <p><span className="font-medium">Graduation Year:</span> {selected.profile?.graduationYear || "-"}</p>
            <p><span className="font-medium">Current Company:</span> {selected.profile?.currentCompany || "-"}</p>
            <p><span className="font-medium">Job Title:</span> {selected.profile?.jobTitle || "-"}</p>
            <p><span className="font-medium">Location:</span> {selected.profile?.location || "-"}</p>
            <p><span className="font-medium">Skills:</span> {Array.isArray(selected.profile?.skills) && selected.profile.skills.length > 0 ? selected.profile.skills.join(", ") : "-"}</p>
            <button
              onClick={() => {
                if (isStudent) {
                  navigate(`/profile/visit/${selected._id}`);
                  return;
                }
                navigate("/chat", {
                  state: {
                    chatTarget: {
                      _id: selected._id,
                      name: selected.name,
                      email: selected.email,
                      prn: selected.prn,
                    },
                  },
                });
              }}
              className={`w-full mt-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded border text-sm ${
                isStudent
                  ? "border-blue-300 text-blue-700 hover:bg-blue-50"
                  : "border-emerald-300 text-emerald-700 hover:bg-emerald-50"
              }`}
            >
              {isStudent ? "View Profile / Request Chat" : "Private Chat"}
            </button>
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

        <div className="pt-3 border-t">
          <p className="text-[11px] uppercase tracking-wide text-slate-500 inline-flex items-center gap-1">
            <FiFilter size={12} /> Category Legend
          </p>
          <div className="mt-2 space-y-1.5">
            {Object.entries(CATEGORY_META)
              .filter(([key]) => key !== "all")
              .map(([key, meta]) => (
                <div key={key} className="flex items-center justify-between text-xs">
                  <span className={`inline-flex border rounded-full px-2 py-0.5 ${meta.badgeClass}`}>{meta.label}</span>
                  <span className="text-slate-500">{countsByCategory[key] || 0}</span>
                </div>
              ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
