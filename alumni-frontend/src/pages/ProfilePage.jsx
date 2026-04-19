import React, { useEffect, useMemo, useState } from "react";
import { FaGithub, FaLinkedin, FaMapMarkerAlt } from "react-icons/fa";
import { FiAlertTriangle, FiBriefcase, FiEdit2, FiEye, FiLock, FiSave, FiUpload, FiUser } from "react-icons/fi";
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

const toList = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const FieldRow = ({ label, value }) => (
  <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
    <p className="text-[11px] uppercase tracking-wide text-slate-500">{label}</p>
    <p className="text-sm text-slate-800 mt-0.5 break-words">{value || "-"}</p>
  </div>
);

const DocumentCard = ({ title, url, onUpload, uploadLabel, uploading, canEdit, onView }) => (
  <div className="rounded-lg border border-slate-200 bg-white px-3 py-3 space-y-2">
    <div className="flex items-center justify-between gap-2">
      <p className="text-sm font-medium text-slate-800">{title}</p>
      <span
        className={`text-[11px] px-2 py-0.5 rounded-full border ${
          url ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "border-slate-200 bg-slate-50 text-slate-600"
        }`}
      >
        {url ? "Uploaded" : "Not uploaded"}
      </span>
    </div>

    <div className="flex flex-wrap gap-2">
      {canEdit && (
        <label className="inline-flex cursor-pointer items-center gap-2 rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50">
          <FiUpload size={13} /> {uploading ? "Uploading..." : uploadLabel}
          <input type="file" accept="application/pdf,.pdf" className="hidden" onChange={onUpload} />
        </label>
      )}
      {url && (
        <button
          onClick={onView}
          className="inline-flex items-center gap-2 rounded border border-blue-300 bg-blue-50 px-3 py-1.5 text-xs text-blue-700 hover:bg-blue-100"
        >
          <FiEye size={13} /> View PDF
        </button>
      )}
    </div>
  </div>
);

export default function ProfilePage() {
  const [role, setRole] = useState("");
  const [completion, setCompletion] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
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
  const [pdfViewer, setPdfViewer] = useState({ open: false, title: "", url: "" });

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  const uploadsConfigured = Boolean(cloudName && uploadPreset);

  const avatar = form.profileImage?.trim() || defaultAvatar(form.name);
  const showStudentFields = role === "student";
  const showAlumniFields = role === "alumni";

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

  const uploadToCloudinary = async ({ field, file, endpoint, validator, errorLabel, folder = "alumhub/profile" }) => {
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
      body.append("folder", folder);

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
          setMessage("Student documents must be valid PDF files.");
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
          setMessage("Alumni documents must be valid PDF files.");
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
      setIsEditing(false);
      setMessage("Profile updated successfully. A confirmation email has been triggered.");
    } catch (err) {
      setMessage(getErrorMessage(err, "Failed to update profile"));
    } finally {
      setSaving(false);
    }
  };

  const completionPercent = completion?.completionPercent || 0;
  const completionMessage =
    completion && !completion.isComplete
      ? `Profile ${completionPercent}% complete. Missing: ${(completion.missingFields || []).slice(0, 5).join(", ")}`
      : "Profile complete. Great work.";

  const subtitle = useMemo(() => {
    if (form.headline) return form.headline;
    if (showAlumniFields && form.currentCompany) return `${form.jobTitle || "Professional"} at ${form.currentCompany}`;
    return form.branch || "Profile";
  }, [form.branch, form.currentCompany, form.headline, form.jobTitle, showAlumniFields]);

  return (
    <div className="min-h-screen bg-slate-100 py-6 px-4">
      <div className="max-w-6xl mx-auto grid lg:grid-cols-[320px,1fr] gap-3 sm:gap-4">
        <aside className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm h-fit space-y-4">
          <label
            className={`mx-auto block w-fit ${isEditing ? "cursor-pointer" : "cursor-default"}`}
            title={isEditing ? "Click profile photo to upload image" : "Profile photo"}
          >
            <img
              src={avatar}
              alt="Profile"
              className="h-28 w-28 rounded-full object-cover border border-slate-200 mx-auto"
              onError={(e) => {
                e.currentTarget.src = defaultAvatar(form.name);
              }}
            />
            {isEditing && (
              <span className="mt-2 inline-flex items-center gap-1 rounded-full border border-slate-300 px-2 py-0.5 text-[11px] text-slate-700">
                <FiUpload size={11} /> {uploadingField === "profileImage" ? "Uploading..." : "Click photo to upload"}
              </span>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              disabled={!isEditing}
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

          <div className="text-center">
            <h1 className="text-xl font-bold text-slate-900">{form.name || "My Profile"}</h1>
            <p className="text-sm text-slate-500 capitalize">{role || "user"}</p>
            <p className="text-sm text-slate-700 mt-1">{subtitle}</p>
          </div>

          <div className="space-y-1.5 text-sm text-slate-700">
            <p className="inline-flex items-center gap-2"><FaMapMarkerAlt className="text-slate-500" /> {form.location || "-"}</p>
            {showAlumniFields && (
              <p className="inline-flex items-center gap-2"><FiBriefcase className="text-slate-500" /> {form.currentCompany || "-"}</p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
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

        <section className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-slate-900">Profile</h2>
            {!isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-blue-300 bg-blue-50 px-3 py-2 text-sm text-blue-700 hover:bg-blue-100"
              >
                <FiEdit2 size={14} /> Edit Profile
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(false)}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <FiLock size={14} /> Lock Fields
              </button>
            )}
          </div>

          <div
            className={`inline-flex w-full items-start gap-2 rounded-lg border px-3 py-2 text-sm ${
              completion?.isComplete
                ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                : "border-amber-300 bg-amber-50 text-amber-900"
            }`}
          >
            {!completion?.isComplete && <FiAlertTriangle className="mt-0.5 shrink-0" size={15} />}
            <div className="w-full">
              <p>{completionMessage}</p>
              <div className="mt-2 h-2 w-full rounded-full bg-white/70 border border-white/40">
                <div
                  className={`h-full rounded-full ${completion?.isComplete ? "bg-emerald-500" : "bg-amber-500"}`}
                  style={{ width: `${completionPercent}%` }}
                />
              </div>
            </div>
          </div>

          {!isEditing && (
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-2">
                <FieldRow label="Name" value={form.name} />
                <FieldRow label="Email" value={form.email} />
                <FieldRow label="Phone" value={form.phone} />
                <FieldRow label="Location" value={form.location} />
                <FieldRow label="Branch" value={form.branch} />
                <FieldRow label="Graduation Year" value={form.graduationYear} />
                {showStudentFields && <FieldRow label="Year Of Study" value={form.yearOfStudy} />}
                {showAlumniFields && <FieldRow label="Current Company" value={form.currentCompany} />}
                {showAlumniFields && <FieldRow label="Job Title" value={form.jobTitle} />}
              </div>
              <FieldRow label="Headline" value={form.headline} />
              <FieldRow label="Bio" value={form.bio} />
              <FieldRow label="Skills" value={toList(form.skills).join(", ")} />
              <FieldRow label="Interests" value={toList(form.interests).join(", ")} />
              <FieldRow label="Achievements" value={toList(form.achievements).join(", ")} />
              <div className="grid md:grid-cols-3 gap-2">
                <FieldRow label="LinkedIn" value={form.linkedIn} />
                <FieldRow label="GitHub" value={form.github} />
                <FieldRow label="Portfolio" value={form.portfolio} />
              </div>
            </div>
          )}

          {isEditing && (
            <div className="space-y-3">
              <input name="name" value={form.name} onChange={onChange} className="w-full border rounded-lg px-3 py-2" placeholder="Name" />
              <input name="email" value={form.email} onChange={onChange} className="w-full border rounded-lg px-3 py-2" placeholder="Email" />
              <input name="phone" value={form.phone} onChange={onChange} className="w-full border rounded-lg px-3 py-2" placeholder="Phone" />
              <input name="location" value={form.location} onChange={onChange} className="w-full border rounded-lg px-3 py-2" placeholder="Location" />
              <input name="branch" value={form.branch} onChange={onChange} className="w-full border rounded-lg px-3 py-2" placeholder="Branch" />
              <input
                name="graduationYear"
                value={form.graduationYear}
                onChange={onChange}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Graduation Year"
              />
              {showStudentFields && (
                <input
                  name="yearOfStudy"
                  value={form.yearOfStudy}
                  onChange={onChange}
                  className="w-full border rounded-lg px-3 py-2"
                  placeholder="Year Of Study"
                />
              )}
              {showAlumniFields && (
                <>
                  <input
                    name="currentCompany"
                    value={form.currentCompany}
                    onChange={onChange}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Current Company"
                  />
                  <input
                    name="jobTitle"
                    value={form.jobTitle}
                    onChange={onChange}
                    className="w-full border rounded-lg px-3 py-2"
                    placeholder="Job Title"
                  />
                </>
              )}
              <input name="headline" value={form.headline} onChange={onChange} className="w-full border rounded-lg px-3 py-2" placeholder="Headline" />
              <textarea name="bio" value={form.bio} onChange={onChange} rows={4} className="w-full border rounded-lg px-3 py-2" placeholder="About / Bio" />
              <input name="skills" value={form.skills} onChange={onChange} className="w-full border rounded-lg px-3 py-2" placeholder="Skills (comma separated)" />
              <input name="interests" value={form.interests} onChange={onChange} className="w-full border rounded-lg px-3 py-2" placeholder="Interests (comma separated)" />
              <input
                name="achievements"
                value={form.achievements}
                onChange={onChange}
                className="w-full border rounded-lg px-3 py-2"
                placeholder="Achievements (comma separated)"
              />
              <input name="linkedIn" value={form.linkedIn} onChange={onChange} className="w-full border rounded-lg px-3 py-2" placeholder="LinkedIn URL" />
              <input name="github" value={form.github} onChange={onChange} className="w-full border rounded-lg px-3 py-2" placeholder="GitHub URL" />
              <input name="portfolio" value={form.portfolio} onChange={onChange} className="w-full border rounded-lg px-3 py-2" placeholder="Portfolio URL" />
            </div>
          )}

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-2">
            <p className="text-sm font-medium text-slate-800">Verification Documents (PDF)</p>
            {showAlumniFields && (
              <>
                <DocumentCard
                  title="Resume"
                  url={form.resumeLink}
                  canEdit={isEditing}
                  uploadLabel="Upload Resume"
                  uploading={uploadingField === "resumeLink"}
                  onUpload={(e) =>
                    uploadToCloudinary({
                      field: "resumeLink",
                      file: e.target.files?.[0],
                      endpoint: "raw",
                      validator: isPdfFile,
                      errorLabel: "Please upload a PDF file.",
                      folder: "alumhub/signup-documents",
                    })
                  }
                  onView={() => setPdfViewer({ open: true, title: "Resume", url: form.resumeLink })}
                />
                <DocumentCard
                  title="Last Year Fee Receipt"
                  url={form.lastYearFeeReceiptUrl}
                  canEdit={isEditing}
                  uploadLabel="Upload Fee Receipt"
                  uploading={uploadingField === "lastYearFeeReceiptUrl"}
                  onUpload={(e) =>
                    uploadToCloudinary({
                      field: "lastYearFeeReceiptUrl",
                      file: e.target.files?.[0],
                      endpoint: "raw",
                      validator: isPdfFile,
                      errorLabel: "Please upload a PDF file.",
                      folder: "alumhub/signup-documents",
                    })
                  }
                  onView={() =>
                    setPdfViewer({
                      open: true,
                      title: "Last Year Fee Receipt",
                      url: form.lastYearFeeReceiptUrl,
                    })
                  }
                />
              </>
            )}
            {showStudentFields && (
              <>
                <DocumentCard
                  title="Recent Fee Receipt"
                  url={form.recentFeeReceiptUrl}
                  canEdit={isEditing}
                  uploadLabel="Upload Fee Receipt"
                  uploading={uploadingField === "recentFeeReceiptUrl"}
                  onUpload={(e) =>
                    uploadToCloudinary({
                      field: "recentFeeReceiptUrl",
                      file: e.target.files?.[0],
                      endpoint: "raw",
                      validator: isPdfFile,
                      errorLabel: "Please upload a PDF file.",
                      folder: "alumhub/signup-documents",
                    })
                  }
                  onView={() =>
                    setPdfViewer({
                      open: true,
                      title: "Recent Fee Receipt",
                      url: form.recentFeeReceiptUrl,
                    })
                  }
                />
                <DocumentCard
                  title="Student ID Card"
                  url={form.studentIdCardUrl}
                  canEdit={isEditing}
                  uploadLabel="Upload ID Card"
                  uploading={uploadingField === "studentIdCardUrl"}
                  onUpload={(e) =>
                    uploadToCloudinary({
                      field: "studentIdCardUrl",
                      file: e.target.files?.[0],
                      endpoint: "raw",
                      validator: isPdfFile,
                      errorLabel: "Please upload a PDF file.",
                      folder: "alumhub/signup-documents",
                    })
                  }
                  onView={() =>
                    setPdfViewer({
                      open: true,
                      title: "Student ID Card",
                      url: form.studentIdCardUrl,
                    })
                  }
                />
              </>
            )}
          </div>

          {isEditing && (
            <div className="flex items-center gap-2">
              <button
                onClick={saveProfile}
                disabled={saving}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:bg-blue-300"
              >
                <FiSave size={14} /> {saving ? "Saving..." : "Save Profile"}
              </button>
            </div>
          )}

          {message && <p className="text-sm text-slate-700">{message}</p>}
        </section>
      </div>

      {pdfViewer.open && (
        <div className="fixed inset-0 z-50 bg-black/60 p-3 sm:p-6">
          <div className="mx-auto h-full w-full max-w-6xl rounded-xl border bg-white shadow-xl flex flex-col overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-2 border-b px-3 sm:px-4 py-3 bg-slate-50">
              <div className="min-w-0">
                <p className="font-semibold text-slate-800 truncate">{pdfViewer.title}</p>
                <p className="text-xs text-slate-500 truncate">{pdfViewer.url}</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={pdfViewer.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2 py-1 rounded border border-slate-300 text-xs hover:bg-slate-100"
                >
                  Open in new tab
                </a>
                <button
                  onClick={() => setPdfViewer({ open: false, title: "", url: "" })}
                  className="px-2 py-1 rounded border border-slate-300 text-xs hover:bg-slate-100"
                >
                  Close
                </button>
              </div>
            </div>
            <object data={pdfViewer.url} type="application/pdf" className="h-full w-full">
              <div className="h-full w-full flex items-center justify-center p-4 text-sm text-slate-600">
                Preview blocked. Use "Open in new tab".
              </div>
            </object>
          </div>
        </div>
      )}
    </div>
  );
}
