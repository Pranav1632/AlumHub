import React, { useState } from "react";
import api from "../utils/axiosInstance";
import { getErrorMessage } from "../utils/errorUtils";

export default function Feedback() {
  const [formData, setFormData] = useState({
    category: "feedback",
    subject: "",
    message: "",
  });
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess("");
    setError("");

    if (!formData.subject.trim() || !formData.message.trim()) {
      setError("Please fill subject and message.");
      return;
    }

    try {
      setSubmitting(true);
      await api.post("/feedback", {
        category: formData.category,
        subject: formData.subject.trim(),
        message: formData.message.trim(),
      });
      setSuccess("Your message has been submitted to admin.");
      setFormData({
        category: "feedback",
        subject: "",
        message: "",
      });
    } catch (err) {
      setError(getErrorMessage(err, "Failed to submit feedback"));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <h1 className="text-2xl font-bold text-slate-900">Feedback and Complaint Form</h1>
        <p className="text-sm text-slate-500 mt-1">
          Submit feedback, complaints, suggestions, or bug reports directly to the admin office.
        </p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Category</label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
            >
              <option value="feedback">Feedback</option>
              <option value="complaint">Complaint</option>
              <option value="suggestion">Suggestion</option>
              <option value="bug_report">Bug Report</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Subject</label>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              className="w-full border border-slate-300 rounded-lg px-3 py-2"
              placeholder="Write a short subject"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Message</label>
            <textarea
              name="message"
              value={formData.message}
              onChange={handleChange}
              rows={6}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 resize-none"
              placeholder="Describe your feedback/complaint with full details"
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold disabled:bg-blue-300"
          >
            {submitting ? "Submitting..." : "Submit To Admin"}
          </button>
        </form>

        {success && <p className="mt-3 text-sm text-emerald-700">{success}</p>}
        {error && <p className="mt-3 text-sm text-red-700">{error}</p>}
      </div>
    </div>
  );
}
