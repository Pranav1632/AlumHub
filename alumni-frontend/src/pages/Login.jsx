import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/axiosInstance";
import logo from "../assets/logo.png"; // Replace with your logo

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post("/auth/login", { email, password });

      if (res.data?.token && res.data?.role) {
        login(res.data);
        localStorage.setItem("token", res.data.token);
        localStorage.setItem("user", JSON.stringify(res.data));

        if (res.data.role === "student") navigate("/dashboard/student");
        else if (res.data.role === "alumni") navigate("/dashboard/alumni");
        else if (res.data.role === "collegeAdmin") navigate("/dashboard/college");
        else navigate("/");
      } else {
        setError("Invalid login response from server.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Login failed. Please check your email/password."
      );
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-200 px-4 overflow-hidden">
      {/* Decorative circles in background */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-blue-300 rounded-full opacity-30 animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-300 rounded-full opacity-30 animate-bounce"></div>

      {/* Glassmorphism Card */}
      <div className="bg-white/70 backdrop-blur-lg shadow-2xl rounded-2xl p-10 w-full max-w-md z-10 animate-fade-in">
        {/* Rotating Logo */}
        <div className="flex justify-center mb-6">
          <img
  src={logo}
  alt="Logo"
  className="h-20 w-20 rounded-full animate-zoom-bounce transition duration-500"
/>
        </div>

        <h2 className="text-3xl font-bold text-blue-800 mb-6 text-center">
          Login to AlumHub
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:opacity-90 transition duration-200"
          >
            Log In
          </button>
        </form>

        {error && (
          <p className="mt-4 text-red-600 border border-red-400 bg-red-50 p-3 rounded text-sm">
            {error}
          </p>
        )}

        {/* Info cards below login */}
        <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 text-center text-sm">
          <div className="p-3 rounded-lg shadow bg-white hover:shadow-md transition">
            🔒 <p className="mt-2 font-semibold">Secure Access</p>
            <p className="text-xs text-gray-500">Your data is safe with us</p>
          </div>
          <div className="p-3 rounded-lg shadow bg-white hover:shadow-md transition">
            🎓 <p className="mt-2 font-semibold">Multi-Role</p>
            <p className="text-xs text-gray-500">Student, Alumni & Admin</p>
          </div>
          <div className="p-3 rounded-lg shadow bg-white hover:shadow-md transition">
            ⚡ <p className="mt-2 font-semibold">Fast Login</p>
            <p className="text-xs text-gray-500">Quick & seamless access</p>
          </div>
        </div>
      </div>
    </div>
  );
}
