import React, { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FiCalendar, FiClock, FiHome, FiLogOut, FiMessageSquare, FiSearch, FiShield, FiUser, FiUsers } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";
import NotificationBell from "./NotificationBell";
import api from "../utils/axiosInstance";
import { getErrorMessage } from "../utils/errorUtils";

const dashboardPath = (role) => {
  if (role === "student") return "/student/dashboard";
  if (role === "alumni") return "/alumni/dashboard";
  if (role === "admin") return "/admin/dashboard";
  return "/";
};

const navBase =
  "inline-flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg transition-colors duration-150";
const mobileNavBase =
  "shrink-0 inline-flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg border transition-colors duration-150";

const normalizeRole = (role) => {
  if (role === "collegeAdmin" || role === "superAdmin" || role === "admin") return "admin";
  return role;
};

const roleLabel = (role) => {
  const normalized = normalizeRole(role);
  if (normalized === "admin") return "Admin";
  if (normalized === "alumni") return "Alumni";
  if (normalized === "student") return "Student";
  return "Member";
};

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const desktopSearchRef = useRef(null);
  const mobileSearchRef = useRef(null);

  const [globalQuery, setGlobalQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchResults, setSearchResults] = useState({ users: [], chats: [] });

  const navStyle = ({ isActive }) =>
    `${navBase} ${
      isActive ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-slate-100"
    }`;
  const mobileNavStyle = ({ isActive }) =>
    `${mobileNavBase} ${
      isActive
        ? "bg-blue-600 text-white border-blue-600"
        : "bg-white text-slate-700 border-slate-300 hover:bg-slate-50"
    }`;

  const onLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const hasSearchResults = useMemo(
    () => (searchResults.users?.length || 0) > 0 || (searchResults.chats?.length || 0) > 0,
    [searchResults]
  );

  useEffect(() => {
    if (!user) {
      setGlobalQuery("");
      setSearchOpen(false);
      setSearchLoading(false);
      setSearchError("");
      setSearchResults({ users: [], chats: [] });
      return;
    }

    const query = globalQuery.trim();
    if (!query) {
      setSearchLoading(false);
      setSearchError("");
      setSearchResults({ users: [], chats: [] });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const res = await api.get(`/user/global-search?q=${encodeURIComponent(query)}&limit=6`);
        setSearchResults({
          users: res.data?.users || [],
          chats: res.data?.chats || [],
        });
        setSearchError("");
      } catch (err) {
        setSearchResults({ users: [], chats: [] });
        setSearchError(getErrorMessage(err, "Could not fetch search results"));
      } finally {
        setSearchLoading(false);
      }
    }, 220);

    return () => clearTimeout(timer);
  }, [globalQuery, user]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      const insideDesktop = desktopSearchRef.current?.contains(event.target);
      const insideMobile = mobileSearchRef.current?.contains(event.target);
      if (!insideDesktop && !insideMobile) {
        setSearchOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const clearSearch = () => {
    setGlobalQuery("");
    setSearchOpen(false);
    setSearchLoading(false);
    setSearchError("");
    setSearchResults({ users: [], chats: [] });
  };

  const openProfileResult = (id) => {
    if (!id) return;
    navigate(`/profile/visit/${id}`);
    clearSearch();
  };

  const openChatResult = (target, source = "user") => {
    if (!target?._id) return;

    const targetRole = normalizeRole(target.role);
    if (source === "user" && user?.role === "student" && targetRole === "alumni") {
      navigate(`/profile/visit/${target._id}`);
      clearSearch();
      return;
    }

    navigate("/chat", {
      state: {
        chatTarget: {
          _id: target._id,
          name: target.name,
          email: target.email,
          prn: target.prn,
        },
      },
    });
    clearSearch();
  };

  const searchDropdown = (
    <div className="absolute top-full mt-2 left-0 w-full rounded-xl border border-slate-200 bg-white shadow-xl p-2 z-[70]">
      {searchLoading && <p className="px-2 py-2 text-xs text-slate-500">Searching...</p>}
      {!searchLoading && searchError && <p className="px-2 py-2 text-xs text-red-600">{searchError}</p>}

      {!searchLoading && !searchError && (
        <div className="space-y-2 max-h-[340px] overflow-y-auto">
          {searchResults.users?.length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-500 px-2 py-1">People</p>
              {searchResults.users.map((item) => (
                <div
                  key={`user-${item._id}`}
                  className="flex items-center gap-2 rounded-lg px-2 py-2 hover:bg-slate-50"
                >
                  <button
                    type="button"
                    onClick={() => openProfileResult(item._id)}
                    className="flex-1 text-left"
                  >
                    <p className="text-sm font-medium text-slate-800 truncate">{item.name}</p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {roleLabel(item.role)} • {item.prn || item.instituteCode || item.email}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => openChatResult(item, "user")}
                    className="text-[11px] px-2 py-1 rounded border border-emerald-300 text-emerald-700 hover:bg-emerald-50"
                  >
                    Chat
                  </button>
                </div>
              ))}
            </div>
          )}

          {searchResults.chats?.length > 0 && (
            <div>
              <p className="text-[11px] uppercase tracking-wide text-slate-500 px-2 py-1">Recent Chats</p>
              {searchResults.chats.map((item, index) => (
                <button
                  key={`chat-${item.user?._id || index}`}
                  type="button"
                  onClick={() => openChatResult(item.user, "chat")}
                  className="w-full text-left rounded-lg px-2 py-2 hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-800 truncate">{item.user?.name || "Chat User"}</p>
                      <p className="text-[11px] text-slate-500 truncate">{item.lastMessage || "Open conversation"}</p>
                    </div>
                    <span className="inline-flex items-center gap-1 text-[10px] text-slate-400 shrink-0">
                      <FiClock size={11} /> {item.lastAt ? new Date(item.lastAt).toLocaleDateString() : "-"}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!hasSearchResults && globalQuery.trim() && (
            <p className="px-2 py-2 text-xs text-slate-500">No matching users or chats.</p>
          )}
          {!hasSearchResults && !globalQuery.trim() && (
            <p className="px-2 py-2 text-xs text-slate-500">Type to search admin, alumni, students, or chats.</p>
          )}
        </div>
      )}
    </div>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
        <NavLink to="/" className="flex items-center gap-3 min-w-0">
          <img src={logo} alt="AlumHub Logo" className="h-11 w-11 rounded-full object-cover border border-slate-200" />
          <div className="min-w-0">
            <p className="text-xl font-bold text-slate-900 leading-tight">AlumHub</p>
            <p className="text-xs text-slate-500 leading-tight">Alumni Network Platform</p>
          </div>
        </NavLink>

        {user && (
          <div ref={desktopSearchRef} className="hidden md:block flex-1 max-w-xl relative">
            <FiSearch className="absolute left-3 top-2.5 text-slate-400" size={14} />
            <input
              value={globalQuery}
              onChange={(e) => {
                setGlobalQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search admin, alumni, students, chats..."
              className="w-full border border-slate-300 rounded-xl pl-9 pr-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {searchOpen && searchDropdown}
          </div>
        )}

        <nav className="hidden lg:flex items-center gap-2">
          {!user && (
            <>
              <NavLink to="/" className={navStyle}>
                <FiHome size={15} /> Home
              </NavLink>
              <NavLink to="/login" className={navStyle}>
                <FiUser size={15} /> Login
              </NavLink>
              <NavLink to="/signup" className={navStyle}>
                <FiUsers size={15} /> Student/Alumni Signup
              </NavLink>
            </>
          )}

          {user && (
            <>
              <NavLink to={dashboardPath(user.role)} className={navStyle}>
                <FiHome size={15} /> Dashboard
              </NavLink>
              <NavLink to="/discussion" className={navStyle}>
                <FiShield size={15} /> Community
              </NavLink>
              <NavLink to="/events" className={navStyle}>
                <FiCalendar size={15} /> Events
              </NavLink>
              <NavLink to="/profile" className={navStyle}>
                <FiUser size={15} /> Profile
              </NavLink>
              <NavLink to="/feedback" className={navStyle}>
                <FiMessageSquare size={15} /> Feedback
              </NavLink>
              {(user.role === "student" || user.role === "admin") && (
                <NavLink to="/alumni-directory" className={navStyle}>
                  <FiUsers size={15} /> Alumni
                </NavLink>
              )}
              <NotificationBell />
              <button
                onClick={onLogout}
                className="inline-flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-lg text-red-600 hover:bg-red-50"
              >
                <FiLogOut size={15} /> Logout
              </button>
            </>
          )}
        </nav>

        <div className="lg:hidden flex items-center gap-2">
          {!user ? (
            <>
              <NavLink to="/login" className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium">
                Login
              </NavLink>
              <NavLink to="/signup" className="px-3 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium">
                Signup
              </NavLink>
            </>
          ) : (
            <>
              <NotificationBell />
              <button
                onClick={onLogout}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 text-sm"
              >
                <FiLogOut size={14} /> Logout
              </button>
            </>
          )}
        </div>
      </div>

      {user && (
        <div className="lg:hidden border-t border-slate-200 bg-white">
          <div ref={mobileSearchRef} className="px-3 pt-3 pb-1 relative">
            <FiSearch className="absolute left-6 top-5.5 text-slate-400" size={13} />
            <input
              value={globalQuery}
              onChange={(e) => {
                setGlobalQuery(e.target.value);
                setSearchOpen(true);
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search users or chats"
              className="w-full border border-slate-300 rounded-lg pl-8 pr-3 py-2 text-sm bg-white"
            />
            {searchOpen && searchDropdown}
          </div>
          <div className="px-3 py-2 overflow-x-auto">
            <nav className="flex items-center gap-2 w-max min-w-full">
              <NavLink to={dashboardPath(user.role)} className={mobileNavStyle}>
                <FiHome size={13} /> Dashboard
              </NavLink>
              <NavLink to="/discussion" className={mobileNavStyle}>
                <FiShield size={13} /> Community
              </NavLink>
              <NavLink to="/events" className={mobileNavStyle}>
                <FiCalendar size={13} /> Events
              </NavLink>
              <NavLink to="/profile" className={mobileNavStyle}>
                <FiUser size={13} /> Profile
              </NavLink>
              <NavLink to="/feedback" className={mobileNavStyle}>
                <FiMessageSquare size={13} /> Feedback
              </NavLink>
              {(user.role === "student" || user.role === "admin") && (
                <NavLink to="/alumni-directory" className={mobileNavStyle}>
                  <FiUsers size={13} /> Alumni
                </NavLink>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  );
}
