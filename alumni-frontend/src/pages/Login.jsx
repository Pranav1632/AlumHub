import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../utils/axiosInstance";

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
        // Update AuthContext
        login(res.data);

        // ✅ Save token in localStorage (needed for axiosInstance)
        localStorage.setItem("token", res.data.token);

        // ✅ Optional: save user details for refresh
        localStorage.setItem("user", JSON.stringify(res.data));

        // Redirect based on role
        if (res.data.role === "student") navigate("/dashboard/student");
        else if (res.data.role === "alumni") navigate("/dashboard/alumni");
        else if (res.data.role === "collegeAdmin") navigate("/dashboard/college");
        else navigate("/");
      } else {
        setError("Invalid login response from server.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.response?.data?.message ||
          "Login failed. Please check your email/password."
      );
    }
  };

  return (
    <div className="p-8 max-w-md mx-auto">
      <h2 className="text-2xl font-bold mb-4">Login</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1">Email:</label>
          <input
            type="email"
            className="border w-full p-2 rounded"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label className="block mb-1">Password:</label>
          <input
            type="password"
            className="border w-full p-2 rounded"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded w-full"
        >
          Login
        </button>
      </form>

      {error && (
        <p className="mt-4 text-red-600 border border-red-400 p-2 rounded">
          {error}
        </p>
      )}
    </div>
  );
}
