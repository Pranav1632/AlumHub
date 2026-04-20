import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiArrowRight, FiCheckCircle, FiFileText, FiRefreshCw, FiUpload, FiUserPlus } from "react-icons/fi";
import api from "../utils/axiosInstance";
import { getErrorMessage } from "../utils/errorUtils";

const isPdfFile = (file) => {
  if (!file) return false;
  if (String(file.type || "").toLowerCase() === "application/pdf") return true;
  return String(file.name || "").toLowerCase().endsWith(".pdf");
};

const documentLabelByField = {
  resumeLink: "Resume (PDF)",
  lastYearFeeReceiptUrl: "Last Year Fee Receipt (PDF)",
  recentFeeReceiptUrl: "Recent Fee Receipt (PDF)",
  studentIdCardUrl: "Student ID Card (PDF)",
};

export default function Signup() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    role: "student",
    prn: "",
    collegeId: "",
    branch: "",
    yearOfStudy: "",
    graduationYear: "",
    currentCompany: "",
    jobTitle: "",
    location: "",
    resumeLink: "",
    lastYearFeeReceiptUrl: "",
    recentFeeReceiptUrl: "",
    studentIdCardUrl: "",
  });
  const [otpCode, setOtpCode] = useState("");
  const [awaitingEmailVerification, setAwaitingEmailVerification] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [resending, setResending] = useState(false);
  const [uploadingField, setUploadingField] = useState("");

  const cloudName = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;
  const uploadsConfigured = Boolean(cloudName && uploadPreset);

  const isStudent = formData.role === "student";
  const isAlumni = formData.role === "alumni";

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const uploadDocument = async (fieldName, file) => {
    if (!file) return;
    setError("");
    setSuccess("");

    if (!isPdfFile(file)) {
      setError(`${documentLabelByField[fieldName]} must be a PDF file.`);
      return;
    }

    if (!uploadsConfigured) {
      setError("Document upload is not configured. Add Cloudinary env vars first.");
      return;
    }

    try {
      setUploadingField(fieldName);
      const body = new FormData();
      body.append("file", file);
      body.append("upload_preset", uploadPreset);
      body.append("folder", "alumhub/signup-documents");

      const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/raw/upload`, {
        method: "POST",
        body,
      });

      if (!response.ok) {
        throw new Error("Upload failed");
      }

      const payload = await response.json();
      const uploadedUrl = String(payload?.secure_url || "").trim();

      if (!uploadedUrl || !uploadedUrl.toLowerCase().includes(".pdf")) {
        throw new Error("Invalid PDF response");
      }

      setFormData((prev) => ({ ...prev, [fieldName]: uploadedUrl }));
      setSuccess(`${documentLabelByField[fieldName]} uploaded successfully.`);
    } catch (uploadError) {
      console.error("Document upload error:", uploadError);
      setError(`Failed to upload ${documentLabelByField[fieldName]}. Please retry.`);
    } finally {
      setUploadingField("");
    }
  };

  const signupPayload = useMemo(
    () => ({
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      password: formData.password,
      confirmPassword: formData.confirmPassword,
      role: formData.role,
      collegeId: formData.collegeId.trim(),
      prn: formData.prn.trim().toUpperCase(),
      branch: formData.branch.trim(),
      yearOfStudy: formData.yearOfStudy.trim(),
      graduationYear: formData.graduationYear.trim(),
      currentCompany: formData.currentCompany.trim(),
      jobTitle: formData.jobTitle.trim(),
      location: formData.location.trim(),
      resumeLink: formData.resumeLink.trim(),
      lastYearFeeReceiptUrl: formData.lastYearFeeReceiptUrl.trim(),
      recentFeeReceiptUrl: formData.recentFeeReceiptUrl.trim(),
      studentIdCardUrl: formData.studentIdCardUrl.trim(),
    }),
    [formData]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    if (isAlumni && !signupPayload.resumeLink && !signupPayload.lastYearFeeReceiptUrl) {
      setError("For alumni, upload Resume PDF or Last Year Fee Receipt PDF.");
      return;
    }

    if (isStudent && !signupPayload.recentFeeReceiptUrl && !signupPayload.studentIdCardUrl) {
      setError("For students, upload Recent Fee Receipt PDF or Student ID Card PDF.");
      return;
    }

    setLoading(true);

    try {
      const res = await api.post("/auth/signup", signupPayload);
      setSuccess(res.data?.msg || "Signup successful.");
      setAwaitingEmailVerification(true);
    } catch (err) {
      if (err?.code === "ECONNABORTED") {
        setError(
          "Signup request timed out. Your account may still be created. Retry once with the same email, or use login/resend verification code."
        );
        return;
      }
      setError(getErrorMessage(err, "Signup failed"));
    } finally {
      setLoading(false);
    }
  };

  const verifyEmailCode = async () => {
    if (!otpCode.trim()) {
      setError("Please enter the email verification code.");
      return;
    }

    try {
      setVerifying(true);
      setError("");
      const res = await api.post("/auth/verify-email", {
        email: signupPayload.email,
        collegeId: signupPayload.collegeId,
        code: otpCode.trim(),
      });
      setSuccess(res.data?.msg || "Email verified successfully.");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(getErrorMessage(err, "Email verification failed"));
    } finally {
      setVerifying(false);
    }
  };

  const resendEmailCode = async () => {
    try {
      setResending(true);
      setError("");
      const res = await api.post("/auth/resend-email-code", {
        email: signupPayload.email,
        collegeId: signupPayload.collegeId,
      });
      setSuccess(res.data?.msg || "Verification code sent.");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to resend verification code"));
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-2 sm:px-4 py-4 sm:py-6">
      <div className="w-full max-w-4xl bg-white border border-slate-200 shadow-lg rounded-2xl p-4 sm:p-6 md:p-8">
        <h2 className="text-2xl font-bold text-slate-900 mb-2 inline-flex items-center gap-2">
          <FiUserPlus size={22} /> Student/Alumni Signup
        </h2>
        <p className="text-sm text-slate-500 mb-2">
          Formal onboarding fields are mandatory for admin verification.
        </p>
        <p className="text-xs text-slate-500 mb-5">
          Profile details like headline, bio, skills, interests and achievements are now collected after login in Profile section.
        </p>

        {!awaitingEmailVerification && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input name="name" value={formData.name} onChange={handleChange} placeholder="Full Name" className="md:col-span-2 border rounded-lg px-3 py-2" required />
              <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="Email" className="border rounded-lg px-3 py-2" required />
              <input name="phone" value={formData.phone} onChange={handleChange} placeholder="Phone Number" className="border rounded-lg px-3 py-2" required />
              <input name="collegeId" value={formData.collegeId} onChange={handleChange} placeholder="College ID (e.g. COLLEGE_1)" className="border rounded-lg px-3 py-2" required />
              <select name="role" value={formData.role} onChange={handleChange} className="border rounded-lg px-3 py-2">
                <option value="student">Student</option>
                <option value="alumni">Alumni</option>
              </select>
              <input name="prn" value={formData.prn} onChange={handleChange} placeholder="PRN" className="md:col-span-2 border rounded-lg px-3 py-2" required />
              <input name="branch" value={formData.branch} onChange={handleChange} placeholder="Branch" className="border rounded-lg px-3 py-2" required />
              <input name="graduationYear" value={formData.graduationYear} onChange={handleChange} placeholder="Graduation Year" className="border rounded-lg px-3 py-2" required />
              {isStudent && <input name="yearOfStudy" value={formData.yearOfStudy} onChange={handleChange} placeholder="Year Of Study" className="border rounded-lg px-3 py-2" required />}
              {isAlumni && <input name="currentCompany" value={formData.currentCompany} onChange={handleChange} placeholder="Current Company" className="border rounded-lg px-3 py-2" required />}
              {isAlumni && <input name="jobTitle" value={formData.jobTitle} onChange={handleChange} placeholder="Job Title" className="border rounded-lg px-3 py-2" required />}
              <input name="location" value={formData.location} onChange={handleChange} placeholder="Location" className="md:col-span-2 border rounded-lg px-3 py-2" required />
              <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="Password" className="border rounded-lg px-3 py-2" required />
              <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="Confirm Password" className="border rounded-lg px-3 py-2" required />
              <div className="md:col-span-2 rounded-xl border border-sky-200 bg-sky-50 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-sm font-semibold text-sky-900 inline-flex items-center gap-2">
                    <FiFileText size={15} /> Mandatory Verification Documents (PDF Only)
                  </h3>
                  {!uploadsConfigured && (
                    <span className="text-[11px] px-2 py-1 rounded-full bg-amber-100 text-amber-800">
                      Cloudinary setup required
                    </span>
                  )}
                </div>
                <p className="text-xs text-sky-800 mt-1">
                  {isAlumni
                    ? "For alumni, at least one is compulsory: Resume OR Last Year Fee Receipt."
                    : "For students, at least one is compulsory: Recent Fee Receipt OR Student ID Card."}
                </p>

                <div className="grid md:grid-cols-2 gap-3 mt-3">
                  {isAlumni && (
                    <>
                      <label className="border border-sky-200 bg-white rounded-lg px-3 py-2 text-sm cursor-pointer hover:bg-sky-50">
                        <span className="font-medium inline-flex items-center gap-2">
                          <FiUpload size={14} /> Upload Resume PDF
                        </span>
                        <input
                          type="file"
                          accept="application/pdf,.pdf"
                          className="hidden"
                          onChange={(e) => uploadDocument("resumeLink", e.target.files?.[0])}
                        />
                        <p className={`mt-2 text-xs ${formData.resumeLink ? "text-emerald-700" : "text-slate-500"}`}>
                          {formData.resumeLink ? "PDF uploaded successfully" : "No PDF uploaded yet"}
                        </p>
                        {uploadingField === "resumeLink" && <p className="text-xs text-blue-700 mt-1">Uploading...</p>}
                      </label>

                      <label className="border border-sky-200 bg-white rounded-lg px-3 py-2 text-sm cursor-pointer hover:bg-sky-50">
                        <span className="font-medium inline-flex items-center gap-2">
                          <FiUpload size={14} /> Upload Last Year Fee Receipt PDF
                        </span>
                        <input
                          type="file"
                          accept="application/pdf,.pdf"
                          className="hidden"
                          onChange={(e) => uploadDocument("lastYearFeeReceiptUrl", e.target.files?.[0])}
                        />
                        <p className={`mt-2 text-xs ${formData.lastYearFeeReceiptUrl ? "text-emerald-700" : "text-slate-500"}`}>
                          {formData.lastYearFeeReceiptUrl ? "PDF uploaded successfully" : "No PDF uploaded yet"}
                        </p>
                        {uploadingField === "lastYearFeeReceiptUrl" && <p className="text-xs text-blue-700 mt-1">Uploading...</p>}
                      </label>
                    </>
                  )}

                  {isStudent && (
                    <>
                      <label className="border border-sky-200 bg-white rounded-lg px-3 py-2 text-sm cursor-pointer hover:bg-sky-50">
                        <span className="font-medium inline-flex items-center gap-2">
                          <FiUpload size={14} /> Upload Recent Fee Receipt PDF
                        </span>
                        <input
                          type="file"
                          accept="application/pdf,.pdf"
                          className="hidden"
                          onChange={(e) => uploadDocument("recentFeeReceiptUrl", e.target.files?.[0])}
                        />
                        <p className={`mt-2 text-xs ${formData.recentFeeReceiptUrl ? "text-emerald-700" : "text-slate-500"}`}>
                          {formData.recentFeeReceiptUrl ? "PDF uploaded successfully" : "No PDF uploaded yet"}
                        </p>
                        {uploadingField === "recentFeeReceiptUrl" && <p className="text-xs text-blue-700 mt-1">Uploading...</p>}
                      </label>

                      <label className="border border-sky-200 bg-white rounded-lg px-3 py-2 text-sm cursor-pointer hover:bg-sky-50">
                        <span className="font-medium inline-flex items-center gap-2">
                          <FiUpload size={14} /> Upload Student ID Card PDF
                        </span>
                        <input
                          type="file"
                          accept="application/pdf,.pdf"
                          className="hidden"
                          onChange={(e) => uploadDocument("studentIdCardUrl", e.target.files?.[0])}
                        />
                        <p className={`mt-2 text-xs ${formData.studentIdCardUrl ? "text-emerald-700" : "text-slate-500"}`}>
                          {formData.studentIdCardUrl ? "PDF uploaded successfully" : "No PDF uploaded yet"}
                        </p>
                        {uploadingField === "studentIdCardUrl" && <p className="text-xs text-blue-700 mt-1">Uploading...</p>}
                      </label>
                    </>
                  )}
                </div>
              </div>
              <button disabled={loading} className="md:col-span-2 inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg py-2.5 font-semibold">
                {loading ? "Creating account..." : "Signup"} <FiArrowRight size={16} />
              </button>
            </div>
          </form>
        )}

        {awaitingEmailVerification && (
          <div className="space-y-3 border border-blue-200 bg-blue-50 rounded-xl p-4">
            <p className="text-sm text-blue-900 font-medium">Step 2: Verify your email before login</p>
            <p className="text-xs text-blue-800">A 6-digit code has been sent to {signupPayload.email}.</p>
            <input
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="Enter 6-digit email code"
              className="w-full border rounded-lg px-3 py-2"
            />
            <div className="flex flex-wrap gap-2">
              <button
                onClick={verifyEmailCode}
                disabled={verifying}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm disabled:bg-emerald-300"
              >
                <FiCheckCircle size={14} /> {verifying ? "Verifying..." : "Verify Email"}
              </button>
              <button
                onClick={resendEmailCode}
                disabled={resending}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 text-sm"
              >
                <FiRefreshCw size={14} /> {resending ? "Resending..." : "Resend Code"}
              </button>
            </div>
          </div>
        )}

        {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
        {success && <p className="text-sm text-green-600 mt-3">{success}</p>}

        <p className="text-sm text-slate-600 mt-5">
          Already have an account? <Link to="/login" className="text-blue-600 font-medium">Login</Link>
        </p>
      </div>
    </div>
  );
}
