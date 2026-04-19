import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FiCheckCircle, FiEdit2, FiFileText, FiRefreshCw, FiTrash2, FiXCircle } from "react-icons/fi";
import api from "../../utils/axiosInstance";

const emptyEvent = {
  title: "",
  description: "",
  date: "",
  time: "",
  venue: "",
  registrationLink: "",
  status: "published",
};

const toDateInput = (value) => {
  if (!value) return "";
  try {
    return new Date(value).toISOString().slice(0, 10);
  } catch {
    return "";
  }
};

export default function CollegeDashboard() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [pendingRoleFilter, setPendingRoleFilter] = useState("all");
  const [users, setUsers] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [events, setEvents] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [summary, setSummary] = useState(null);
  const [eventForm, setEventForm] = useState(emptyEvent);
  const [editingEventId, setEditingEventId] = useState("");
  const [feedbackResponse, setFeedbackResponse] = useState({});
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [pdfPreview, setPdfPreview] = useState({
    open: false,
    url: "",
    title: "",
    blobUrl: "",
    loading: false,
    loadError: "",
  });

  useEffect(() => {
    return () => {
      if (pdfPreview.blobUrl) {
        URL.revokeObjectURL(pdfPreview.blobUrl);
      }
    };
  }, [pdfPreview.blobUrl]);

  const loadAll = useCallback(async () => {
    try {
      setError("");
      const pendingEndpoint =
        pendingRoleFilter === "all" ? "/admin/pending" : `/admin/pending?role=${pendingRoleFilter}`;
      const [pendingRes, usersRes, feedbackRes, eventsRes, discussionsRes, analyticsRes, summaryRes] = await Promise.all([
        api.get(pendingEndpoint),
        api.get("/admin/users"),
        api.get("/admin/feedback"),
        api.get("/events"),
        api.get("/discussions"),
        api.get("/admin/analytics"),
        api.get("/dashboard/summary"),
      ]);
      setPendingUsers(pendingRes.data?.users || []);
      setUsers(usersRes.data?.users || []);
      setFeedback(feedbackRes.data?.items || []);
      setEvents(eventsRes.data?.events || []);
      setDiscussions(discussionsRes.data || []);
      setAnalytics(analyticsRes.data?.analytics || null);
      setSummary(summaryRes.data || null);
    } catch (err) {
      setError(err.response?.data?.msg || "Unable to load admin dashboard");
    }
  }, [pendingRoleFilter]);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) => `${u.name} ${u.email} ${u.prn || ""}`.toLowerCase().includes(q));
  }, [users, search]);

  const formatList = (items) => {
    if (!Array.isArray(items) || items.length === 0) return "-";
    return items.slice(0, 3).join(", ");
  };

  const verify = async (id) => {
    try {
      await api.put(`/admin/verify/${id}`);
      setStatus("User verified.");
      loadAll();
    } catch (err) {
      setError(err.response?.data?.msg || "Verify failed");
    }
  };

  const reject = async (id, name) => {
    const reason = window.prompt(`Reason for rejecting ${name || "this user"}?`, "Registration details not acceptable.");
    if (reason === null) return;

    try {
      await api.put(`/admin/reject/${id}`, { reason: reason.trim() });
      setStatus("User rejected and rejection email sent.");
      loadAll();
    } catch (err) {
      setError(err.response?.data?.msg || "Reject failed");
    }
  };

  const openPdfPreview = async (url, title) => {
    const safeUrl = String(url || "").trim();
    if (!safeUrl) {
      setError("No PDF URL available for preview.");
      return;
    }

    if (pdfPreview.blobUrl) {
      URL.revokeObjectURL(pdfPreview.blobUrl);
    }

    setPdfPreview({
      open: true,
      url: safeUrl,
      title: title || "Document Preview",
      blobUrl: "",
      loading: true,
      loadError: "",
    });

    try {
      const response = await fetch(safeUrl);
      if (!response.ok) {
        throw new Error(`Failed with status ${response.status}`);
      }
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      setPdfPreview((prev) => ({
        ...prev,
        blobUrl: objectUrl,
        loading: false,
        loadError: "",
      }));
    } catch (previewError) {
      console.error("PDF preview fetch error:", previewError);
      setPdfPreview((prev) => ({
        ...prev,
        loading: false,
        loadError: "Inline preview failed in browser. Use Open in new tab.",
      }));
    }
  };

  const closePdfPreview = () => {
    if (pdfPreview.blobUrl) {
      URL.revokeObjectURL(pdfPreview.blobUrl);
    }
    setPdfPreview({
      open: false,
      url: "",
      title: "",
      blobUrl: "",
      loading: false,
      loadError: "",
    });
  };

  const getVerificationDocs = (u) => {
    const profile = u?.profile || {};
    const docs = [];

    if (profile.resumeLink) {
      docs.push({ label: "Resume", url: profile.resumeLink });
    }
    if (profile.lastYearFeeReceiptUrl) {
      docs.push({ label: "Last Year Fee Receipt", url: profile.lastYearFeeReceiptUrl });
    }
    if (profile.recentFeeReceiptUrl) {
      docs.push({ label: "Recent Fee Receipt", url: profile.recentFeeReceiptUrl });
    }
    if (profile.studentIdCardUrl) {
      docs.push({ label: "Student ID Card", url: profile.studentIdCardUrl });
    }

    return docs;
  };

  const toggleAccountBlock = async (u) => {
    try {
      await api.put(`/admin/${u.blocked ? "unblock" : "block"}/${u._id}`);
      setStatus(u.blocked ? "Account unblocked." : "Account blocked.");
      loadAll();
    } catch (err) {
      setError(err.response?.data?.msg || "Account action failed");
    }
  };

  const toggleCommunityBlock = async (u) => {
    try {
      await api.patch(`/admin/community-access/${u._id}`, { blocked: !u.communityChatBlocked });
      setStatus(!u.communityChatBlocked ? "Community access blocked." : "Community access restored.");
      loadAll();
    } catch (err) {
      setError(err.response?.data?.msg || "Community action failed");
    }
  };

  const toggleDirectChatBlock = async (u) => {
    try {
      await api.patch(`/admin/direct-chat-access/${u._id}`, { blocked: !u.directChatBlocked });
      setStatus(!u.directChatBlocked ? "Direct chat blocked." : "Direct chat restored.");
      loadAll();
    } catch (err) {
      setError(err.response?.data?.msg || "Direct chat action failed");
    }
  };

  const removeDiscussion = async (id) => {
    try {
      await api.delete(`/admin/discussion/${id}`);
      setStatus("Discussion removed.");
      loadAll();
    } catch (err) {
      setError(err.response?.data?.msg || "Could not remove discussion");
    }
  };

  const saveEvent = async () => {
    try {
      if (!eventForm.title || !eventForm.date) {
        setError("Event title and date are required.");
        return;
      }
      if (editingEventId) {
        await api.put(`/events/${editingEventId}`, eventForm);
        setStatus("Event updated.");
      } else {
        await api.post("/events", eventForm);
        setStatus("Event created.");
      }
      setEventForm(emptyEvent);
      setEditingEventId("");
      loadAll();
    } catch (err) {
      setError(err.response?.data?.msg || "Event save failed");
    }
  };

  const startEditEvent = (e) => {
    setEditingEventId(e._id);
    setEventForm({
      title: e.title || "",
      description: e.description || "",
      date: toDateInput(e.date),
      time: e.time || "",
      venue: e.venue || "",
      registrationLink: e.registrationLink || "",
      status: e.status || "published",
    });
  };

  const deleteEvent = async (id) => {
    try {
      await api.delete(`/events/${id}`);
      setStatus("Event deleted.");
      loadAll();
    } catch (err) {
      setError(err.response?.data?.msg || "Event delete failed");
    }
  };

  const setFeedbackStatus = async (item, nextStatus) => {
    try {
      await api.patch(`/admin/feedback/${item._id}/status`, {
        status: nextStatus,
        adminResponse: feedbackResponse[item._id] ?? item.adminResponse ?? "",
      });
      setStatus("Feedback status updated.");
      loadAll();
    } catch (err) {
      setError(err.response?.data?.msg || "Feedback update failed");
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-5 sm:py-6 px-2 space-y-4 sm:space-y-5">
      <section className="rounded-xl border border-[#0c2d53] bg-gradient-to-r from-[#0c2d53] to-[#1b4c80] text-white p-5">
        <h1 className="text-2xl sm:text-3xl font-bold">Admin Secretariat Dashboard</h1>
        <p className="text-sm text-blue-100 mt-1">Formal college control center for verification, moderation, complaints and insights.</p>
        <button onClick={loadAll} className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded bg-white text-[#0c2d53] text-sm font-semibold">
          <FiRefreshCw size={14} /> Refresh
        </button>
      </section>

      <section className="grid grid-cols-2 lg:grid-cols-5 gap-2 sm:gap-3">
        <Metric title="Students" value={analytics?.totalStudents || 0} />
        <Metric title="Alumni" value={analytics?.totalAlumni || 0} />
        <Metric title="Pending Verify" value={analytics?.pendingVerification || 0} />
        <Metric title="Open Complaints" value={analytics?.openComplaints || 0} />
        <Metric title="Community Posts" value={analytics?.discussionCount || 0} />
      </section>

      <section className="rounded-xl border bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <h2 className="text-lg sm:text-xl font-semibold text-[#123b63]">Pending Verification Requests</h2>
          <div className="inline-flex rounded-md border border-slate-300 overflow-hidden text-xs">
            <button
              onClick={() => setPendingRoleFilter("all")}
              className={`px-3 py-1.5 ${pendingRoleFilter === "all" ? "bg-[#123b63] text-white" : "bg-white text-slate-700"}`}
            >
              All
            </button>
            <button
              onClick={() => setPendingRoleFilter("student")}
              className={`px-3 py-1.5 border-l ${pendingRoleFilter === "student" ? "bg-[#123b63] text-white" : "bg-white text-slate-700"}`}
            >
              Student
            </button>
            <button
              onClick={() => setPendingRoleFilter("alumni")}
              className={`px-3 py-1.5 border-l ${pendingRoleFilter === "alumni" ? "bg-[#123b63] text-white" : "bg-white text-slate-700"}`}
            >
              Alumni
            </button>
          </div>
        </div>
        <div className="md:hidden space-y-2">
          {pendingUsers.map((u) => (
            <div key={`mobile-pending-${u._id}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-semibold text-slate-900 truncate">{u.name}</p>
                  <p className="text-xs capitalize text-slate-600">{u.role}</p>
                </div>
                <div className="flex flex-col gap-1">
                  <button onClick={() => verify(u._id)} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-600 text-white text-xs">
                    <FiCheckCircle size={12} /> Verify
                  </button>
                  <button onClick={() => reject(u._id, u.name)} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-600 text-white text-xs">
                    <FiXCircle size={12} /> Reject
                  </button>
                </div>
              </div>
              <div className="mt-2 text-xs text-slate-700 space-y-0.5">
                <p>PRN: {u.prn || "-"}</p>
                <p className="break-all">Email: {u.email || "-"}</p>
                <p>Phone: {u.phone || "-"}</p>
                <p>Branch: {u.profile?.branch || "-"}</p>
                <p>Year/Grad: {u.profile?.yearOfStudy || "-"} / {u.profile?.graduationYear || "-"}</p>
                <p>Company/Title: {u.profile?.currentCompany || "-"} / {u.profile?.jobTitle || "-"}</p>
                <p>Email OTP: {u.emailVerified ? "Verified" : "Pending"} | Phone OTP: {u.phoneVerified ? "Verified" : "Pending"}</p>
              </div>
              <div className="mt-2">
                <p className="text-xs font-medium text-slate-700 mb-1">Uploaded PDFs</p>
                <div className="flex flex-wrap gap-1">
                  {getVerificationDocs(u).length === 0 && <span className="text-xs text-slate-500">No documents</span>}
                  {getVerificationDocs(u).map((doc) => (
                    <button
                      key={`mobile-doc-${u._id}-${doc.label}`}
                      onClick={() => openPdfPreview(doc.url, `${u.name} - ${doc.label}`)}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded border border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100 text-xs"
                    >
                      <FiFileText size={11} /> {doc.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ))}
          {pendingUsers.length === 0 && <p className="text-sm text-slate-500">No pending verification requests.</p>}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[1300px] text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-2 text-left">Applicant</th>
                <th className="p-2 text-left">Identity</th>
                <th className="p-2 text-left">Verification Flags</th>
                <th className="p-2 text-left">Academic/Professional</th>
                <th className="p-2 text-left">Profile Snapshot</th>
                <th className="p-2 text-left">Action</th>
              </tr>
            </thead>
            <tbody>
              {pendingUsers.map((u) => (
                <tr key={u._id} className="border-t align-top">
                  <td className="p-2">
                    <p className="font-semibold text-slate-900">{u.name}</p>
                    <p className="text-xs capitalize text-slate-600">{u.role}</p>
                  </td>
                  <td className="p-2 text-xs">
                    <p>PRN: {u.prn || "-"}</p>
                    <p>Email: {u.email || "-"}</p>
                    <p>Phone: {u.phone || "-"}</p>
                  </td>
                  <td className="p-2 text-xs">
                    <p>Email OTP: {u.emailVerified ? "Verified" : "Pending"}</p>
                    <p>Phone OTP: {u.phoneVerified ? "Verified" : "Pending"}</p>
                    <p>Admin Approval: {u.verified ? "Approved" : "Pending"}</p>
                  </td>
                  <td className="p-2 text-xs">
                    <p>Branch: {u.profile?.branch || "-"}</p>
                    <p>Study Year: {u.profile?.yearOfStudy || "-"}</p>
                    <p>Graduation: {u.profile?.graduationYear || "-"}</p>
                    <p>Company: {u.profile?.currentCompany || "-"}</p>
                    <p>Job Title: {u.profile?.jobTitle || "-"}</p>
                  </td>
                  <td className="p-2 text-xs">
                    <p>Location: {u.profile?.location || "-"}</p>
                    <p>Headline: {u.profile?.headline || "-"}</p>
                    <p>Skills: {formatList(u.profile?.skills)}</p>
                    <p>Interests: {formatList(u.profile?.interests)}</p>
                    <div className="mt-2">
                      <p className="font-semibold text-slate-700 mb-1">Uploaded PDFs:</p>
                      <div className="flex flex-wrap gap-1">
                        {getVerificationDocs(u).length === 0 && <span className="text-slate-500">No documents</span>}
                        {getVerificationDocs(u).map((doc) => (
                          <button
                            key={`${u._id}-${doc.label}`}
                            onClick={() => openPdfPreview(doc.url, `${u.name} - ${doc.label}`)}
                            className="inline-flex items-center gap-1 px-2 py-1 rounded border border-blue-300 text-blue-700 bg-blue-50 hover:bg-blue-100"
                            title={doc.url}
                          >
                            <FiFileText size={11} /> {doc.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </td>
                  <td className="p-2">
                    <div className="flex flex-col gap-1">
                      <button onClick={() => verify(u._id)} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-600 text-white text-xs">
                        <FiCheckCircle size={12} /> Verify
                      </button>
                      <button onClick={() => reject(u._id, u.name)} className="inline-flex items-center gap-1 px-2 py-1 rounded bg-red-600 text-white text-xs">
                        <FiXCircle size={12} /> Reject
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <h2 className="text-lg sm:text-xl font-semibold text-[#123b63]">User Governance Controls</h2>
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users" className="border rounded px-3 py-2 text-sm w-full sm:w-64" />
        </div>
        <div className="md:hidden space-y-2">
          {filteredUsers.map((u) => (
            <div key={`mobile-user-${u._id}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="font-medium text-slate-900">{u.name}</p>
              <p className="text-xs text-slate-600 break-all">{u.email} | {u.prn || "NA"}</p>
              <div className="mt-1 text-xs text-slate-700 space-y-0.5">
                <p>Email Verified: {u.emailVerified ? "Yes" : "No"} | Admin Verified: {u.verified ? "Yes" : "No"}</p>
                <p>Account: {u.blocked ? "Blocked" : "Active"}</p>
                <p>Community: {u.communityChatBlocked ? "Blocked" : "Allowed"} | Direct Chat: {u.directChatBlocked ? "Blocked" : "Allowed"}</p>
              </div>
              <div className="mt-2 flex flex-wrap gap-1">
                <button onClick={() => toggleAccountBlock(u)} className="px-2 py-1 border rounded text-xs">{u.blocked ? "Unblock" : "Block"}</button>
                <button onClick={() => toggleCommunityBlock(u)} className="px-2 py-1 border rounded text-xs">{u.communityChatBlocked ? "Allow Community" : "Block Community"}</button>
                <button onClick={() => toggleDirectChatBlock(u)} className="px-2 py-1 border rounded text-xs">{u.directChatBlocked ? "Allow Chat" : "Block Chat"}</button>
              </div>
            </div>
          ))}
          {filteredUsers.length === 0 && <p className="text-sm text-slate-500">No users found.</p>}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[1050px] text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="p-2 text-left">User</th><th className="p-2 text-left">Verification</th><th className="p-2 text-left">Account</th>
                <th className="p-2 text-left">Community</th><th className="p-2 text-left">Direct Chat</th><th className="p-2 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((u) => (
                <tr key={u._id} className="border-t">
                  <td className="p-2"><p className="font-medium">{u.name}</p><p className="text-xs">{u.email} | {u.prn || "NA"}</p></td>
                  <td className="p-2 text-xs">Email: {u.emailVerified ? "Yes" : "No"}<p>Admin: {u.verified ? "Yes" : "No"}</p></td>
                  <td className="p-2">{u.blocked ? "Blocked" : "Active"}</td>
                  <td className="p-2">{u.communityChatBlocked ? "Blocked" : "Allowed"}</td>
                  <td className="p-2">{u.directChatBlocked ? "Blocked" : "Allowed"}</td>
                  <td className="p-2">
                    <div className="flex flex-wrap gap-1">
                      <button onClick={() => toggleAccountBlock(u)} className="px-2 py-1 border rounded text-xs">{u.blocked ? "Unblock" : "Block"}</button>
                      <button onClick={() => toggleCommunityBlock(u)} className="px-2 py-1 border rounded text-xs">{u.communityChatBlocked ? "Allow Community" : "Block Community"}</button>
                      <button onClick={() => toggleDirectChatBlock(u)} className="px-2 py-1 border rounded text-xs">{u.directChatBlocked ? "Allow Chat" : "Block Chat"}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-xl border bg-white p-4 space-y-3">
        <h2 className="text-lg sm:text-xl font-semibold text-[#123b63]">Calendar Event Control</h2>
        <div className="grid md:grid-cols-3 gap-2">
          <input value={eventForm.title} onChange={(e) => setEventForm((p) => ({ ...p, title: e.target.value }))} placeholder="Title" className="border rounded px-3 py-2 text-sm" />
          <input type="date" value={eventForm.date} onChange={(e) => setEventForm((p) => ({ ...p, date: e.target.value }))} className="border rounded px-3 py-2 text-sm" />
          <input value={eventForm.time} onChange={(e) => setEventForm((p) => ({ ...p, time: e.target.value }))} placeholder="Time" className="border rounded px-3 py-2 text-sm" />
          <input value={eventForm.venue} onChange={(e) => setEventForm((p) => ({ ...p, venue: e.target.value }))} placeholder="Venue" className="border rounded px-3 py-2 text-sm" />
          <input value={eventForm.registrationLink} onChange={(e) => setEventForm((p) => ({ ...p, registrationLink: e.target.value }))} placeholder="Registration link" className="border rounded px-3 py-2 text-sm" />
          <select value={eventForm.status} onChange={(e) => setEventForm((p) => ({ ...p, status: e.target.value }))} className="border rounded px-3 py-2 text-sm"><option value="published">Published</option><option value="draft">Draft</option></select>
          <textarea value={eventForm.description} onChange={(e) => setEventForm((p) => ({ ...p, description: e.target.value }))} rows={2} placeholder="Description" className="md:col-span-3 border rounded px-3 py-2 text-sm" />
        </div>
        <button onClick={saveEvent} className="px-4 py-2 rounded bg-[#123b63] text-white text-sm">{editingEventId ? "Update Event" : "Create Event"}</button>
        <div className="md:hidden space-y-2">
          {events.map((e) => (
            <div key={`mobile-event-${e._id}`} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <p className="font-medium text-slate-900">{e.title}</p>
              <p className="text-xs text-slate-600">{new Date(e.date).toLocaleDateString()} {e.time ? `| ${e.time}` : ""}</p>
              <p className="text-xs text-slate-600">{e.venue || "-"}</p>
              <div className="mt-2 flex gap-1">
                <button onClick={() => startEditEvent(e)} className="inline-flex items-center gap-1 px-2 py-1 border rounded text-xs"><FiEdit2 size={11} /> Edit</button>
                <button onClick={() => deleteEvent(e._id)} className="inline-flex items-center gap-1 px-2 py-1 border border-red-300 text-red-600 rounded text-xs"><FiTrash2 size={11} /> Delete</button>
              </div>
            </div>
          ))}
          {events.length === 0 && <p className="text-sm text-slate-500">No events available.</p>}
        </div>

        <div className="hidden md:block overflow-x-auto">
          <table className="w-full min-w-[780px] text-sm">
            <thead className="bg-slate-100"><tr><th className="p-2 text-left">Title</th><th className="p-2 text-left">Date</th><th className="p-2 text-left">Venue</th><th className="p-2 text-left">Action</th></tr></thead>
            <tbody>
              {events.map((e) => (
                <tr key={e._id} className="border-t">
                  <td className="p-2">{e.title}</td><td className="p-2">{new Date(e.date).toLocaleDateString()} {e.time ? `| ${e.time}` : ""}</td><td className="p-2">{e.venue || "-"}</td>
                  <td className="p-2">
                    <button onClick={() => startEditEvent(e)} className="inline-flex items-center gap-1 px-2 py-1 border rounded text-xs mr-1"><FiEdit2 size={11} /> Edit</button>
                    <button onClick={() => deleteEvent(e._id)} className="inline-flex items-center gap-1 px-2 py-1 border border-red-300 text-red-600 rounded text-xs"><FiTrash2 size={11} /> Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-xl border bg-white p-4">
          <h2 className="text-lg font-semibold text-[#123b63] mb-3">Community Moderation</h2>
          <div className="space-y-2 max-h-[420px] overflow-y-auto">
            {discussions.map((d) => (
              <div key={d._id} className="border rounded p-2">
                <p className="font-medium text-sm">{d.user?.name || "User"} ({d.user?.role || "member"})</p>
                <p className="text-sm text-slate-700 mt-1">{d.content}</p>
                <button onClick={() => removeDiscussion(d._id)} className="mt-2 inline-flex items-center gap-1 px-2 py-1 border border-red-300 text-red-600 rounded text-xs">
                  <FiTrash2 size={11} /> Remove
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border bg-white p-4">
          <h2 className="text-lg font-semibold text-[#123b63] mb-3">Feedback and Complaints</h2>
          <div className="space-y-2 max-h-[420px] overflow-y-auto">
            {feedback.map((f) => (
              <div key={f._id} className="border rounded p-2">
                <p className="font-medium text-sm">{f.subject} <span className="text-xs text-slate-500">({f.category})</span></p>
                <p className="text-xs text-slate-500">{f.userId?.name || "User"} | {f.userId?.email || "-"}</p>
                <p className="text-sm mt-1">{f.message}</p>
                <textarea
                  rows={2}
                  value={feedbackResponse[f._id] ?? f.adminResponse ?? ""}
                  onChange={(e) => setFeedbackResponse((p) => ({ ...p, [f._id]: e.target.value }))}
                  placeholder="Admin response"
                  className="w-full mt-2 border rounded px-2 py-1 text-xs"
                />
                <div className="flex gap-1 mt-1">
                  <button onClick={() => setFeedbackStatus(f, "in_review")} className="px-2 py-1 border rounded text-xs">In Progress</button>
                  <button onClick={() => setFeedbackStatus(f, "resolved")} className="px-2 py-1 border rounded text-xs">Resolved</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-sky-800 bg-gradient-to-br from-[#0c2d53] via-[#114075] to-[#1f5e9c] p-4 text-white shadow-md">
          <h2 className="text-lg font-semibold text-white">College Information</h2>
          <p className="text-sm mt-2 font-medium">{summary?.collegeInfo?.name || "-"}</p>
          <p className="text-sm text-blue-100">{summary?.collegeInfo?.location || "-"} | {summary?.collegeInfo?.accreditation || "-"}</p>
          <p className="text-xs text-blue-100 mt-1">Focus: {Array.isArray(summary?.collegeInfo?.focusAreas) ? summary.collegeInfo.focusAreas.join(", ") : "-"}</p>
          <div className="mt-3 space-y-2">
            {(summary?.collegeNews || []).slice(0, 5).map((n, i) => (
              <div
                key={`${n.title}-${i}`}
                className="border border-white/25 rounded-lg p-2 text-sm bg-white/10 transition-all duration-200 hover:bg-white/20 hover:-translate-y-0.5"
              >
                <p className="font-medium text-white">{n.title}</p>
                <p className="text-xs text-blue-100">{n.summary}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border border-indigo-100 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-lg font-semibold text-[#123b63]">World Tech News</h2>
            <span className="text-[11px] uppercase tracking-wide text-indigo-700 bg-indigo-100 px-2 py-1 rounded-full">
              Live Feed
            </span>
          </div>
          <div className="mt-3 space-y-2">
            {(summary?.techNews || []).slice(0, 6).map((n, i) => (
              <a
                key={`${n.title}-${i}`}
                href={n.url}
                target="_blank"
                rel="noreferrer"
                className="block border border-slate-200 rounded-lg p-2 bg-gradient-to-r from-white via-slate-50 to-indigo-50/50 transition-all duration-200 hover:border-indigo-200 hover:shadow-sm hover:-translate-y-0.5"
              >
                <p className="text-sm font-medium">{n.title}</p>
                <p className="text-xs text-slate-600">{n.source}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      {pdfPreview.open && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[1px] p-3 sm:p-6">
          <div className="mx-auto h-full w-full max-w-6xl rounded-xl border bg-white shadow-xl flex flex-col overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-2 border-b px-3 sm:px-4 py-3 bg-slate-50">
              <div className="min-w-0">
                <p className="font-semibold text-slate-800 truncate">{pdfPreview.title || "PDF Preview"}</p>
                <p className="text-xs text-slate-500 truncate">{pdfPreview.url}</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={pdfPreview.url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-2 py-1 rounded border border-slate-300 text-xs hover:bg-slate-100"
                >
                  Open in new tab
                </a>
                <button onClick={closePdfPreview} className="px-2 py-1 rounded border border-slate-300 text-xs hover:bg-slate-100">
                  Close
                </button>
              </div>
            </div>
            <div className="border-b px-4 py-2 bg-amber-50 text-amber-900 text-xs">
              If inline preview is blocked by browser/embed policy, use "Open in new tab".
            </div>
            <div className="flex-1 bg-slate-100">
              {pdfPreview.loading ? (
                <div className="h-full w-full flex items-center justify-center text-sm text-slate-600">
                  Loading PDF preview...
                </div>
              ) : (
                <object
                  data={pdfPreview.blobUrl || pdfPreview.url}
                  type="application/pdf"
                  className="h-full w-full"
                >
                  <div className="h-full w-full flex flex-col items-center justify-center gap-2 text-sm text-slate-600 p-4 text-center">
                    <p>{pdfPreview.loadError || "PDF preview unavailable in embedded mode."}</p>
                    <a
                      href={pdfPreview.url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3 py-1.5 rounded border border-slate-300 text-xs hover:bg-slate-100"
                    >
                      Open PDF in new tab
                    </a>
                  </div>
                </object>
              )}
            </div>
          </div>
        </div>
      )}

      {status && <p className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 rounded p-2">{status}</p>}
      {error && <p className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">{error}</p>}
    </div>
  );
}

function Metric({ title, value }) {
  return (
    <div className="rounded-lg border bg-white p-3">
      <p className="text-xs uppercase tracking-wide text-slate-500">{title}</p>
      <p className="text-xl sm:text-2xl font-bold text-[#123b63] mt-1">{value}</p>
    </div>
  );
}
