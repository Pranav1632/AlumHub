// src/pages/Signup.jsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../utils/axiosInstance";
import { useAuth } from "../context/AuthContext";

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
      // Prepare payload based on role
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

      // Optional: auto-login after signup
      if (res.data?.token) {
        login(res.data);
        localStorage.setItem("token", res.data.token);

        // Redirect based on role
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
    <div style={{ padding: "2rem" }}>
      <h2>Signup</h2>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Name:</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Email:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Password:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Confirm Password:</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label>Role:</label>
          <select name="role" value={formData.role} onChange={handleChange}>
            <option value="student">Student</option>
            <option value="alumni">Alumni</option>
            <option value="collegeAdmin">College Admin</option>
          </select>
        </div>

        {/* Conditional fields */}
        {(formData.role === "student" || formData.role === "alumni") && (
          <div>
            <label>PRN:</label>
            <input
              type="text"
              name="prn"
              value={formData.prn}
              onChange={handleChange}
              required
            />
          </div>
        )}

        {formData.role === "collegeAdmin" && (
          <div>
            <label>Institute Code:</label>
            <input
              type="text"
              name="instituteCode"
              value={formData.instituteCode}
              onChange={handleChange}
              required
            />
          </div>
        )}

        <button type="submit">Signup</button>
      </form>

      {error && <p style={{ color: "red" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}
    </div>
  );
}
