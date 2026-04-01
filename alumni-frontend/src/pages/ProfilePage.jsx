import React, { useEffect, useState } from "react";
import api from "../utils/axiosInstance";

export default function ProfilePage() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    branch: "",
    graduationYear: "",
    skills: "",
  });
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/user/me");
        const user = res.data?.user || {};
        const profile = res.data?.profile || {};
        setForm({
          name: user.name || "",
          email: user.email || "",
          phone: profile.phone || "",
          branch: profile.branch || "",
          graduationYear: profile.graduationYear || "",
          skills: Array.isArray(profile.skills) ? profile.skills.join(", ") : "",
        });
      } catch {
        setMessage("Could not load profile");
      }
    };
    load();
  }, []);

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const saveProfile = async () => {
    try {
      await api.put("/user/update", {
        name: form.name,
        email: form.email,
        phone: form.phone,
        branch: form.branch,
        graduationYear: form.graduationYear,
        skills: form.skills
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      setMessage("Profile updated successfully");
    } catch {
      setMessage("Failed to update profile");
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">My Profile</h1>
      <div className="bg-white border rounded-lg p-4 space-y-3">
        <input name="name" value={form.name} onChange={onChange} className="w-full border rounded px-3 py-2" placeholder="Name" />
        <input name="email" value={form.email} onChange={onChange} className="w-full border rounded px-3 py-2" placeholder="Email" />
        <input name="phone" value={form.phone} onChange={onChange} className="w-full border rounded px-3 py-2" placeholder="Phone" />
        <input name="branch" value={form.branch} onChange={onChange} className="w-full border rounded px-3 py-2" placeholder="Branch" />
        <input name="graduationYear" value={form.graduationYear} onChange={onChange} className="w-full border rounded px-3 py-2" placeholder="Graduation Year" />
        <input name="skills" value={form.skills} onChange={onChange} className="w-full border rounded px-3 py-2" placeholder="Skills (comma separated)" />

        <button onClick={saveProfile} className="px-4 py-2 bg-blue-600 text-white rounded">Save</button>
        {message && <p className="text-sm text-slate-700">{message}</p>}
      </div>
    </div>
  );
}