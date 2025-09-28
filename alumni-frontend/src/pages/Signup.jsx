// src/pages/Signup.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/axiosInstance";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png"; // Replace with your actual logo path

export default function Signup() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "student",
    prn: "",
    instituteCode: "",
  });

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
      };

      if (formData.role === "student" || formData.role === "alumni") {
        payload.prn = formData.prn;
      } else if (formData.role === "collegeAdmin") {
        payload.instituteCode = formData.instituteCode;
      }

      const res = await api.post("/auth/signup", payload);

      setSuccess("Signup successful! Logging you in...");

      if (res.data?.token) {
        login(res.data);
        localStorage.setItem("token", res.data.token);

        if (res.data.role === "student") navigate("/dashboard/student");
        else if (res.data.role === "alumni") navigate("/dashboard/alumni");
        else if (res.data.role === "collegeAdmin") navigate("/dashboard/college");
        else navigate("/");
      }
    } catch (err) {
      console.error("Signup error:", err);
      setError(err.response?.data?.message || "Signup failed");
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-200 px-4 overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-blue-400 rounded-full opacity-30 animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-500 rounded-full opacity-30 animate-bounce"></div>

      {/* Glassmorphism Signup Card */}
      <div className="bg-white/70 backdrop-blur-lg shadow-2xl rounded-2xl p-10 w-full max-w-lg z-10 animate-fade-in">
        {/* Rotating Logo */}
        <div className="flex justify-center mb-6">
          <img
  src={logo}
  alt="Logo"
  className="h-20 w-20 rounded-full animate-zoom-bounce transition duration-500"
/>
        </div>

        <h2 className="text-3xl font-bold text-blue-800 mb-6 text-center">
          Create Your AlumHub Account
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your full name"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Re-enter your password"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Role
            </label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="student">Student</option>
              <option value="alumni">Alumni</option>
              <option value="collegeAdmin">College Admin</option>
            </select>
          </div>

          {/* Conditional fields */}
          {(formData.role === "student" || formData.role === "alumni") && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                PRN
              </label>
              <input
                type="text"
                name="prn"
                value={formData.prn}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter PRN"
                required
              />
            </div>
          )}

          {formData.role === "collegeAdmin" && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Institute Code
              </label>
              <input
                type="text"
                name="instituteCode"
                value={formData.instituteCode}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter institute code"
                required
              />
            </div>
          )}

          <button
            type="submit"
            className="w-full py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:opacity-90 transition duration-200"
          >
            Sign Up
          </button>
        </form>

        {/* Messages */}
        {error && (
          <p className="mt-4 text-red-600 border border-red-400 bg-red-50 p-3 rounded text-sm">
            {error}
          </p>
        )}
        {success && (
          <p className="mt-4 text-green-600 border border-green-400 bg-green-50 p-3 rounded text-sm">
            {success}
          </p>
        )}

        {/* Info cards */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center text-sm">
          <div className="p-3 rounded-lg shadow bg-white hover:shadow-md transition">
            🎓 <p className="mt-2 font-semibold">Join as Student</p>
            <p className="text-xs text-gray-500">Grow your alumni network</p>
          </div>
          <div className="p-3 rounded-lg shadow bg-white hover:shadow-md transition">
            👨‍🎓 <p className="mt-2 font-semibold">Join as Alumni</p>
            <p className="text-xs text-gray-500">Connect with your college</p>
          </div>
          <div className="p-3 rounded-lg shadow bg-white hover:shadow-md transition">
            🏫 <p className="mt-2 font-semibold">For Admins</p>
            <p className="text-xs text-gray-500">Manage institute records</p>
          </div>
        </div>
      </div>
    </div>
  );
}
