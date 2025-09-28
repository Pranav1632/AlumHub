import React, { useState } from "react";
import api from "../utils/axiosInstance";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png"; // Optional: add logo if needed

export default function Feedback() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    subject: "",
    message: "",
  });

  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");

    if (!formData.subject || !formData.message) {
      setError("Please fill in all fields.");
      return;
    }

    try {
      await api.post("/feedback", {
        userId: user?.id || null,
        ...formData,
      });

      setSuccess("Thank you! Your feedback has been submitted.");
      setFormData({ subject: "", message: "" });
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit feedback.");
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-blue-100 via-purple-100 to-pink-200 px-4 py-10 overflow-hidden">
      {/* Decorative circles */}
      <div className="absolute top-10 left-10 w-32 h-32 bg-blue-400 rounded-full opacity-30 animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-500 rounded-full opacity-30 animate-bounce"></div>

      {/* Glassmorphism Card */}
      <div className="bg-white/70 backdrop-blur-lg shadow-2xl rounded-2xl p-10 w-full max-w-lg z-10 animate-fade-in">
        {/* Optional Logo */}
        {/* <div className="flex justify-center mb-6">
          <img src={logo} alt="Logo" className="h-16 w-16 rounded-full" />
        </div> */}

        <h2 className="text-3xl font-bold text-blue-800 mb-6 text-center">
          Submit Your Feedback
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subject
            </label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="Enter feedback subject"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Message
            </label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="Write your feedback here..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none h-32"
              required
            ></textarea>
          </div>

          <button
            type="submit"
            className="w-full py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:opacity-90 transition duration-200"
          >
            Submit Feedback
          </button>

          {success && (
            <p className="mt-4 text-green-700 border border-green-300 bg-green-50 p-3 rounded text-sm">
              {success}
            </p>
          )}

          {error && (
            <p className="mt-4 text-red-700 border border-red-300 bg-red-50 p-3 rounded text-sm">
              {error}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}