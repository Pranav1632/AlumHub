import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowRight, FiUserPlus } from "react-icons/fi";
import api from "../utils/axiosInstance";
import { getErrorMessage } from "../utils/errorUtils";

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
    prn: "",
    collegeId: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    try {
      setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    } catch {
      setError("Failed to update form fields.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role: formData.role,
        collegeId: formData.collegeId.trim(),
        prn: formData.prn.trim().toUpperCase(),
      };

      const res = await api.post("/auth/signup", payload);
      setSuccess(res.data.msg || "Signup successful");
      setTimeout(() => navigate("/login"), 900);
    } catch (err) {
      setError(getErrorMessage(err, "Signup failed"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[76vh] flex items-center justify-center px-4">
      <div className="w-full max-w-xl bg-white border border-slate-200 shadow-lg rounded-2xl p-6 md:p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2 inline-flex items-center gap-2">
          <FiUserPlus size={22} /> Create Student/Alumni Account
        </h2>
        <p className="text-sm text-slate-500 mb-6">
          Admin signup is disabled. Admins must use login credentials from sample JSON.
        </p>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Full Name"
            className="md:col-span-2 w-full border rounded-lg px-3 py-2"
            required
          />
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="Email"
            className="md:col-span-2 w-full border rounded-lg px-3 py-2"
            required
          />
          <input
            name="collegeId"
            value={formData.collegeId}
            onChange={handleChange}
            placeholder="College ID (ex: COLLEGE_1)"
            className="w-full border rounded-lg px-3 py-2"
            required
          />

          <select
            name="role"
            value={formData.role}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="student">Student</option>
            <option value="alumni">Alumni</option>
          </select>

          <input
            name="prn"
            value={formData.prn}
            onChange={handleChange}
            placeholder="PRN"
            className="md:col-span-2 w-full border rounded-lg px-3 py-2"
            required
          />

          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="Password"
            className="w-full border rounded-lg px-3 py-2"
            required
          />
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="Confirm Password"
            className="w-full border rounded-lg px-3 py-2"
            required
          />

          <button
            disabled={loading}
            className="md:col-span-2 inline-flex items-center justify-center gap-2 w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg py-2.5 font-semibold"
          >
            {loading ? "Creating account..." : "Signup"} <FiArrowRight size={16} />
          </button>
        </form>

        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        {success && <p className="text-sm text-green-600 mt-3">{success}</p>}

        <p className="text-sm text-slate-600 mt-5">
          Already have an account? <Link to="/login" className="text-blue-600 font-medium">Login</Link>
        </p>
      </div>
    </div>
  );
}