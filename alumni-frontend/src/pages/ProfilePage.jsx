import React, { useEffect, useMemo, useState } from "react";
import { FaGithub, FaLinkedin, FaMapMarkerAlt } from "react-icons/fa";
import { FiBriefcase, FiSave, FiUser } from "react-icons/fi";
import api from "../utils/axiosInstance";
import { getErrorMessage } from "../utils/errorUtils";

const defaultAvatar = (name) =>
  `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name || "User")}`;

export default function ProfilePage() {
  const [role, setRole] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    branch: "",
    yearOfStudy: "",
    graduationYear: "",
    currentCompany: "",
    jobTitle: "",
    headline: "",
    bio: "",
    location: "",
    profileImage: "",
    skills: "",
    interests: "",
    achievements: "",
    linkedIn: "",
    github: "",
    portfolio: "",
    resumeLink: "",
  });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const avatar = form.profileImage?.trim() || defaultAvatar(form.name);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/user/me");
        const user = res.data?.user || {};
        const profile = res.data?.profile || {};
        setRole(user.role || "");
        setForm({
          name: user.name || "",
          email: user.email || "",
          phone: profile.phone || user.phone || "",
          branch: profile.branch || "",
          yearOfStudy: profile.yearOfStudy || "",
          graduationYear: profile.graduationYear || "",
          currentCompany: profile.currentCompany || "",
          jobTitle: profile.jobTitle || "",
          headline: profile.headline || "",
          bio: profile.bio || "",
          location: profile.location || "",
          profileImage: profile.profileImage || "",
          skills: Array.isArray(profile.skills) ? profile.skills.join(", ") : "",
          interests: Array.isArray(profile.interests) ? profile.interests.join(", ") : "",
          achievements: Array.isArray(profile.achievements) ? profile.achievements.join(", ") : "",
          linkedIn: profile.linkedIn || "",
          github: profile.github || "",
          portfolio: profile.portfolio || "",
          resumeLink: profile.resumeLink || "",
        });
      } catch (err) {
        setMessage(getErrorMessage(err, "Could not load profile"));
      }
    };
    load();
  }, []);

  const onChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const toList = (value) =>
    value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const saveProfile = async () => {
    try {
      setSaving(true);
      setMessage("");
      await api.put("/user/update", {
        name: form.name,
        email: form.email,
        phone: form.phone,
        branch: form.branch,
        yearOfStudy: form.yearOfStudy,
        graduationYear: form.graduationYear,
        currentCompany: form.currentCompany,
        jobTitle: form.jobTitle,
        headline: form.headline,
        bio: form.bio,
        location: form.location,
        profileImage: form.profileImage,
        linkedIn: form.linkedIn,
        github: form.github,
        portfolio: form.portfolio,
        resumeLink: form.resumeLink,
        skills: toList(form.skills),
        interests: toList(form.interests),
        achievements: toList(form.achievements),
      });
      setMessage("Profile updated successfully.");
    } catch (err) {
      setMessage(getErrorMessage(err, "Failed to update profile"));
    } finally {
      setSaving(false);
    }
  };

  const showStudentFields = role === "student";
  const showAlumniFields = role === "alumni";

  const subtitle = useMemo(() => {
    if (form.headline) return form.headline;
    if (showAlumniFields && form.currentCompany) return `${form.jobTitle || "Professional"} at ${form.currentCompany}`;
    return form.branch || "Update your profile details";
  }, [form, showAlumniFields]);

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-[330px,1fr] gap-4">
        <aside className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm h-fit">
          <img
            src={avatar}
            alt="Profile"
            className="h-28 w-28 rounded-full object-cover border border-slate-200 mx-auto"
            onError={(e) => {
              e.currentTarget.src = defaultAvatar(form.name);
            }}
          />
          <h1 className="text-xl font-bold text-center mt-3">{form.name || "My Profile"}</h1>
          <p className="text-sm text-slate-500 text-center capitalize">{role || "user"}</p>
          <p className="text-sm text-slate-700 text-center mt-2">{subtitle}</p>

          <div className="mt-4 space-y-2 text-sm">
            <p className="inline-flex items-center gap-2"><FaMapMarkerAlt className="text-slate-500" /> {form.location || "-"}</p>
            {showAlumniFields && (
              <p className="inline-flex items-center gap-2"><FiBriefcase className="text-slate-500" /> {form.currentCompany || "-"}</p>
            )}
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            {form.linkedIn && (
              <a
                href={form.linkedIn}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-slate-300 text-sm hover:bg-slate-50"
              >
                <FaLinkedin className="text-blue-700" /> LinkedIn
              </a>
            )}
            {form.github && (
              <a
                href={form.github}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-slate-300 text-sm hover:bg-slate-50"
              >
                <FaGithub /> GitHub
              </a>
            )}
            {form.portfolio && (
              <a
                href={form.portfolio}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded border border-slate-300 text-sm hover:bg-slate-50"
              >
                <FiUser size={14} /> Portfolio
              </a>
            )}
          </div>
        </aside>

        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Edit Profile</h2>

          <div className="grid md:grid-cols-2 gap-3">
            <input name="name" value={form.name} onChange={onChange} className="w-full border rounded-lg px-3 py-2" placeholder="Name" />
            <input name="email" value={form.email} onChange={onChange} className="w-full border rounded-lg px-3 py-2" placeholder="Email" />
            <input name="phone" value={form.phone} onChange={onChange} className="w-full border rounded-lg px-3 py-2" placeholder="Phone" />
            <input name="location" value={form.location} onChange={onChange} className="w-full border rounded-lg px-3 py-2" placeholder="Location" />
            <input name="branch" value={form.branch} onChange={onChange} className="w-full border rounded-lg px-3 py-2" placeholder="Branch" />
            <input name="graduationYear" value={form.graduationYear} onChange={onChange} className="w-full border rounded-lg px-3 py-2" placeholder="Graduation Year" />
            <input name="headline" value={form.headline} onChange={onChange} className="md:col-span-2 w-full border rounded-lg px-3 py-2" placeholder="Headline (example: Full-stack developer | Mentor)" />
            <input name="profileImage" value={form.profileImage} onChange={onChange} className="md:col-span-2 w-full border rounded-lg px-3 py-2" placeholder="Profile Image URL" />

            {showStudentFields && (
              <input name="yearOfStudy" value={form.yearOfStudy} onChange={onChange} className="w-full border rounded-lg px-3 py-2" placeholder="Year Of Study" />
            )}

            {showAlumniFields && (
              <>
                <input name="currentCompany" value={form.currentCompany} onChange={onChange} className="w-full border rounded-lg px-3 py-2" placeholder="Current Company" />
                <input name="jobTitle" value={form.jobTitle} onChange={onChange} className="w-full border rounded-lg px-3 py-2" placeholder="Job Title" />
              </>
            )}

            <textarea name="bio" value={form.bio} onChange={onChange} rows={4} className="md:col-span-2 w-full border rounded-lg px-3 py-2" placeholder="About / Bio" />
            <input name="skills" value={form.skills} onChange={onChange} className="md:col-span-2 w-full border rounded-lg px-3 py-2" placeholder="Skills (comma separated)" />
            <input name="interests" value={form.interests} onChange={onChange} className="md:col-span-2 w-full border rounded-lg px-3 py-2" placeholder="Interests (comma separated)" />
            <input name="achievements" value={form.achievements} onChange={onChange} className="md:col-span-2 w-full border rounded-lg px-3 py-2" placeholder="Achievements (comma separated)" />
            <input name="linkedIn" value={form.linkedIn} onChange={onChange} className="w-full border rounded-lg px-3 py-2" placeholder="LinkedIn URL" />
            <input name="github" value={form.github} onChange={onChange} className="w-full border rounded-lg px-3 py-2" placeholder="GitHub URL" />
            <input name="portfolio" value={form.portfolio} onChange={onChange} className="w-full border rounded-lg px-3 py-2" placeholder="Portfolio URL" />
            <input name="resumeLink" value={form.resumeLink} onChange={onChange} className="w-full border rounded-lg px-3 py-2" placeholder="Resume Link" />
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={saveProfile}
              disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:bg-blue-300"
            >
              <FiSave size={14} /> {saving ? "Saving..." : "Save Profile"}
            </button>
          </div>

          {message && <p className="text-sm text-slate-700 mt-3">{message}</p>}
        </section>
      </div>
    </div>
  );
}
