import React, { useEffect, useMemo, useState } from "react";
import { FaGithub, FaLinkedin, FaMapMarkerAlt } from "react-icons/fa";
import { FiAlertTriangle, FiBriefcase, FiSave, FiUpload, FiUser } from "react-icons/fi";
import api from "../utils/axiosInstance";
import { getErrorMessage } from "../utils/errorUtils";

const defaultAvatar = (name) =>
  `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(name || "User")}`;

const isPdfUrl = (value) => {
  const text = String(value || "").trim();
  if (!text) return false;
  try {
    const parsed = new URL(text);
    if (!["https:", "http:"].includes(parsed.protocol)) return false;
    return String(parsed.pathname || "").toLowerCase().endsWith(".pdf");
  } catch {
    return false;
  }
};

const isImageFile = (file) => String(file?.type || "").startsWith("image/");
const isPdfFile = (file) =>
  String(file?.type || "").toLowerCase() === "application/pdf" ||
  String(file?.name || "").toLowerCase().endsWith(".pdf");

export default function ProfilePage() {
  const [role, setRole] = useState("");
  const [completion, setCompletion] = useState(null);
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
    lastYearFeeReceiptUrl: "",
    recentFeeReceiptUrl: "",
    studentIdCardUrl: "",
  });
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState("");

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  const uploadsConfigured = Boolean(cloudName && uploadPreset);

  const avatar = form.profileImage?.trim() || defaultAvatar(form.name);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/user/me");
        const user = res.data?.user || {};
        const profile = res.data?.profile || {};
        setRole(user.role || "");
        setCompletion(res.data?.profileCompletion || null);
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
          lastYearFeeReceiptUrl: profile.lastYearFeeReceiptUrl || "",
          recentFeeReceiptUrl: profile.recentFeeReceiptUrl || "",
          studentIdCardUrl: profile.studentIdCardUrl || "",
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

  const uploadToCloudinary = async ({ field, file, endpoint, validator, errorLabel }) => {
    if (!file) return;
    setMessage("");

    if (!validator(file)) {
      setMessage(errorLabel);
      return;
    }

    if (!uploadsConfigured) {
      setMessage("Upload is not configured. Add Cloudinary env vars first.");
      return;
    }

    try {
      setUploadingField(field);
      const body = new FormData();
      body.append("file", file);
      body.append("upload_preset", uploadPreset);
      body.append("folder", "alumhub/profile");

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${endpoint}/upload`, {
        method: "POST",
        body,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const payload = await response.json();
      const uploadedUrl = String(payload?.secure_url || "").trim();
      if (!uploadedUrl) {
        throw new Error("Invalid upload response");
      }

      setForm((prev) => ({ ...prev, [field]: uploadedUrl }));
      setMessage("File uploaded successfully.");
    } catch (error) {
      console.error("Cloudinary upload error:", error);
      setMessage("Upload failed. Please try again.");
    } finally {
      setUploadingField("");
    }
  };

  const saveProfile = async () => {
    try {
      setSaving(true);
      setMessage("");

      const listSkills = toList(form.skills);
      const listInterests = toList(form.interests);
      const listAchievements = toList(form.achievements);

      const requiredCommon = [
        form.name,
        form.email,
        form.phone,
        form.branch,
        form.graduationYear,
        form.headline,
        form.bio,
        form.location,
        form.linkedIn,
        form.github,
        form.portfolio,
      ];
      if (requiredCommon.some((item) => !String(item || "").trim())) {
        setMessage("Please fill all required fields before saving profile.");
        return;
      }

      if (listSkills.length === 0 || listInterests.length === 0 || listAchievements.length === 0) {
        setMessage("Skills, interests and achievements are compulsory.");
        return;
      }

      if (role === "student") {
        if (!form.yearOfStudy.trim()) {
          setMessage("Year Of Study is compulsory for students.");
          return;
        }
        if (!form.recentFeeReceiptUrl.trim() && !form.studentIdCardUrl.trim()) {
          setMessage("Upload Recent Fee Receipt PDF or Student ID Card PDF.");
          return;
        }
        if (
          (form.recentFeeReceiptUrl.trim() && !isPdfUrl(form.recentFeeReceiptUrl)) ||
          (form.studentIdCardUrl.trim() && !isPdfUrl(form.studentIdCardUrl))
        ) {
          setMessage("Student document URLs must point to PDF files.");
          return;
        }
      }

      if (role === "alumni") {
        if (!form.currentCompany.trim() || !form.jobTitle.trim()) {
          setMessage("Current company and job title are compulsory for alumni.");
          return;
        }
        if (!form.resumeLink.trim() && !form.lastYearFeeReceiptUrl.trim()) {
          setMessage("Upload Resume PDF or Last Year Fee Receipt PDF.");
          return;
        }
        if (
          (form.resumeLink.trim() && !isPdfUrl(form.resumeLink)) ||
          (form.lastYearFeeReceiptUrl.trim() && !isPdfUrl(form.lastYearFeeReceiptUrl))
        ) {
          setMessage("Alumni document URLs must point to PDF files.");
          return;
        }
      }

      const res = await api.put("/user/update", {
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
        lastYearFeeReceiptUrl: form.lastYearFeeReceiptUrl,
        recentFeeReceiptUrl: form.recentFeeReceiptUrl,
        studentIdCardUrl: form.studentIdCardUrl,
        skills: listSkills,
        interests: listInterests,
        achievements: listAchievements,
      });
      setCompletion(res.data?.profileCompletion || completion);
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

  const completionMessage =
    completion && !completion.isComplete
      ? `Profile ${completion.completionPercent || 0}% complete. Missing: ${(completion.missingFields || []).slice(0, 5).join(", ")}`
      : "";

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
          <h2 className="text-lg font-semibold mb-2">Edit Profile</h2>
          {completion && !completion.isComplete && (
            <div className="mb-4 inline-flex w-full items-start gap-2 rounded-lg border border-amber-300 bg-amber-50 px-3 py-2 text-amber-900 text-sm">
              <FiAlertTriangle className="mt-0.5 shrink-0" size={15} />
              <span>{completionMessage}</span>
            </div>
          )}
          {completion?.isComplete && (
            <div className="mb-4 inline-flex w-full items-start gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-3 py-2 text-emerald-900 text-sm">
              Profile complete. Great work.
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-3">
            <input name="name" value={form.name} onChange={onChange} className="w-full border rounded-lg px-3 py-2" placeholder="Name" required />
            <input name="email" value={form.email} onChange={onChange} className="w-full border rounded-lg px-3 py-2" placeholder="Email" required />
            <input name="phone" value={form.phone} onChange={onChange} className="w-full border rounded-lg px-3 py-2" placeholder="Phone" required />
            <input name="location" value={form.location} onChange={onChange} className="w-full border rounded-lg px-3 py-2" placeholder="Location" required />
            <input name="branch" value={form.branch} onChange={onChange} className="w-full border rounded-lg px-3 py-2" placeholder="Branch" required />
            <input name="graduationYear" value={form.graduationYear} onChange={onChange} className="w-full border rounded-lg px-3 py-2" placeholder="Graduation Year" required />
            <input name="headline" value={form.headline} onChange={onChange} className="md:col-span-2 w-full border rounded-lg px-3 py-2" placeholder="Headline" required />

            <div className="md:col-span-2 grid md:grid-cols-[1fr,auto] gap-2">
              <input name="profileImage" value={form.profileImage} onChange={onChange} className="w-full border rounded-lg px-3 py-2" placeholder="Profile Image URL (optional)" />
              <label className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-300 text-sm cursor-pointer hover:bg-slate-50">
                <FiUpload size={14} /> {uploadingField === "profileImage" ? "Uploading..." : "Upload Image"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    uploadToCloudinary({
                      field: "profileImage",
                      file: e.target.files?.[0],
                      endpoint: "image",
                      validator: isImageFile,
                      errorLabel: "Profile image must be an image file.",
                    })
                  }
                />
              </label>
            </div>

            {showStudentFields && (
              <input name="yearOfStudy" value={form.yearOfStudy} onChange={onChange} className="w-full border rounded-lg px-3 py-2" placeholder="Year Of Study" required />
            )}

            {showAlumniFields && (
              <>
                <input name="currentCompany" value={form.currentCompany} onChange={onChange} className="w-full border rounded-lg px-3 py-2" placeholder="Current Company" required />
                <input name="jobTitle" value={form.jobTitle} onChange={onChange} className="w-full border rounded-lg px-3 py-2" placeholder="Job Title" required />
              </>
            )}

            <textarea name="bio" value={form.bio} onChange={onChange} rows={4} className="md:col-span-2 w-full border rounded-lg px-3 py-2" placeholder="About / Bio" required />
            <input name="skills" value={form.skills} onChange={onChange} className="md:col-span-2 w-full border rounded-lg px-3 py-2" placeholder="Skills (comma separated)" required />
            <input name="interests" value={form.interests} onChange={onChange} className="md:col-span-2 w-full border rounded-lg px-3 py-2" placeholder="Interests (comma separated)" required />
            <input name="achievements" value={form.achievements} onChange={onChange} className="md:col-span-2 w-full border rounded-lg px-3 py-2" placeholder="Achievements (comma separated)" required />
            <input name="linkedIn" value={form.linkedIn} onChange={onChange} className="w-full border rounded-lg px-3 py-2" placeholder="LinkedIn URL" required />
            <input name="github" value={form.github} onChange={onChange} className="w-full border rounded-lg px-3 py-2" placeholder="GitHub URL" required />
            <input name="portfolio" value={form.portfolio} onChange={onChange} className="w-full border rounded-lg px-3 py-2" placeholder="Portfolio URL" required />
            <input name="resumeLink" value={form.resumeLink} onChange={onChange} className="w-full border rounded-lg px-3 py-2" placeholder="Resume PDF URL" />
          </div>

          <div className="mt-4 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-medium text-slate-800 mb-2">Verification Documents (PDF)</p>
            <div className="grid md:grid-cols-2 gap-2">
              {showAlumniFields && (
                <>
                  <input
                    name="lastYearFeeReceiptUrl"
                    value={form.lastYearFeeReceiptUrl}
                    onChange={onChange}
                    className="w-full border rounded-lg px-3 py-2 bg-white"
                    placeholder="Last Year Fee Receipt PDF URL"
                  />
                  <label className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-300 text-sm cursor-pointer bg-white hover:bg-slate-100">
                    <FiUpload size={14} /> {uploadingField === "lastYearFeeReceiptUrl" ? "Uploading..." : "Upload Last Year Fee Receipt"}
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      className="hidden"
                      onChange={(e) =>
                        uploadToCloudinary({
                          field: "lastYearFeeReceiptUrl",
                          file: e.target.files?.[0],
                          endpoint: "raw",
                          validator: isPdfFile,
                          errorLabel: "Please upload a PDF file.",
                        })
                      }
                    />
                  </label>
                </>
              )}

              {showStudentFields && (
                <>
                  <input
                    name="recentFeeReceiptUrl"
                    value={form.recentFeeReceiptUrl}
                    onChange={onChange}
                    className="w-full border rounded-lg px-3 py-2 bg-white"
                    placeholder="Recent Fee Receipt PDF URL"
                  />
                  <label className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-300 text-sm cursor-pointer bg-white hover:bg-slate-100">
                    <FiUpload size={14} /> {uploadingField === "recentFeeReceiptUrl" ? "Uploading..." : "Upload Recent Fee Receipt"}
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      className="hidden"
                      onChange={(e) =>
                        uploadToCloudinary({
                          field: "recentFeeReceiptUrl",
                          file: e.target.files?.[0],
                          endpoint: "raw",
                          validator: isPdfFile,
                          errorLabel: "Please upload a PDF file.",
                        })
                      }
                    />
                  </label>
                  <input
                    name="studentIdCardUrl"
                    value={form.studentIdCardUrl}
                    onChange={onChange}
                    className="w-full border rounded-lg px-3 py-2 bg-white"
                    placeholder="Student ID Card PDF URL"
                  />
                  <label className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-slate-300 text-sm cursor-pointer bg-white hover:bg-slate-100">
                    <FiUpload size={14} /> {uploadingField === "studentIdCardUrl" ? "Uploading..." : "Upload Student ID Card"}
                    <input
                      type="file"
                      accept="application/pdf,.pdf"
                      className="hidden"
                      onChange={(e) =>
                        uploadToCloudinary({
                          field: "studentIdCardUrl",
                          file: e.target.files?.[0],
                          endpoint: "raw",
                          validator: isPdfFile,
                          errorLabel: "Please upload a PDF file.",
                        })
                      }
                    />
                  </label>
                </>
              )}
            </div>
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
