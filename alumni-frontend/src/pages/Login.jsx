import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowRight, FiKey, FiUserCheck } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import api from "../utils/axiosInstance";
import { getErrorMessage } from "../utils/errorUtils";

const portalOptions = [
  { value: "student", label: "Student" },
  { value: "alumni", label: "Alumni" },
  { value: "admin", label: "Admin" },
];

const redirectByRole = (role) => {
  if (role === "student") return "/student/dashboard";
  if (role === "alumni") return "/alumni/dashboard";
  if (role === "admin") return "/admin/dashboard";
  return "/";
};

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [form, setForm] = useState({
    portal: "student",
    identifier: "",
    email: "",
    collegeId: "",
    password: "",
  });
  const [sampleCredentials, setSampleCredentials] = useState({ admins: [] });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadSampleCredentials = async () => {
      try {
        const res = await api.get("/auth/sample-credentials");
        setSampleCredentials(res.data || { admins: [] });
      } catch {
        setSampleCredentials({ admins: [] });
      }
    };

    loadSampleCredentials();
  }, []);

  const handleChange = (e) => {
    try {
      setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    } catch {
      setError("Failed to update form. Please try again.");
    }
  };

  const applySampleAdmin = (sample) => {
    setForm((prev) => ({
      ...prev,
      portal: "admin",
      collegeId: sample.collegeId,
      email: sample.email,
      password: sample.password,
      identifier: "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const payload = {
        portal: form.portal,
        collegeId: form.collegeId.trim(),
        password: form.password,
      };

      if (form.portal === "admin") {
        payload.email = form.email.trim().toLowerCase();
      } else {
        payload.identifier = form.identifier.trim().toUpperCase();
      }

      const res = await api.post("/auth/login", payload);
      login(res.data);
      navigate(redirectByRole(res.data.role), { replace: true });
    } catch (err) {
      setError(getErrorMessage(err, "Login failed"));
    } finally {
      setLoading(false);
    }
  };

  const showAdminField = form.portal === "admin";

  return (
    <div className="min-h-[76vh] flex items-center justify-center px-4">
      <div className="w-full max-w-5xl grid lg:grid-cols-[1.1fr,0.9fr] gap-5">
        <section className="bg-white border border-slate-200 rounded-2xl shadow-lg p-6 md:p-8">
          <h1 className="text-2xl font-bold text-slate-900 mb-2 inline-flex items-center gap-2">
            <FiKey size={22} /> AlumHub Login
          </h1>
          <p className="text-sm text-slate-500 mb-6">Use portal-wise credentials. Admin login works from sample JSON credentials.</p>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Portal</label>
              <select name="portal" value={form.portal} onChange={handleChange} className="w-full border rounded-lg px-3 py-2">
                {portalOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">College ID</label>
              <input
                name="collegeId"
                value={form.collegeId}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="COLLEGE_1"
                required
              />
            </div>

            {showAdminField ? (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">Admin Email</label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="admin@alumhub.demo"
                  required
                />
              </div>
            ) : (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-slate-700 mb-1">PRN</label>
                <input
                  name="identifier"
                  value={form.identifier}
                  onChange={handleChange}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="ALU1001"
                  required
                />
              </div>
            )}

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                className="w-full border rounded-lg px-3 py-2"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="md:col-span-2 inline-flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg py-2.5 font-semibold"
            >
              {loading ? "Logging in..." : "Login"} <FiArrowRight size={16} />
            </button>

            {error && <p className="md:col-span-2 text-sm text-red-600">{error}</p>}
          </form>
        </section>

        <aside className="bg-slate-900 text-white rounded-2xl shadow-lg p-6 md:p-7">
          <h2 className="text-lg font-semibold mb-4 inline-flex items-center gap-2">
            <FiUserCheck size={18} /> Admin Demo Credentials (JSON)
          </h2>

          <div className="space-y-4 max-h-[520px] overflow-y-auto pr-1">
            <div>
              <p className="text-xs uppercase tracking-wide text-slate-300 mb-2">Admins</p>
              <div className="space-y-2">
                {(sampleCredentials.admins || []).map((admin) => (
                  <button
                    key={`${admin.email}-${admin.collegeId}`}
                    onClick={() => applySampleAdmin(admin)}
                    className="w-full text-left bg-white/10 hover:bg-white/15 border border-white/15 rounded-lg p-3"
                  >
                    <p className="font-medium text-sm">{admin.name}</p>
                    <p className="text-xs text-slate-300">{admin.email}</p>
                    <p className="text-xs text-slate-300">{admin.collegeId} | {admin.password}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
