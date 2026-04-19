import React, { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiAward,
  FiCalendar,
  FiChevronDown,
  FiClock,
  FiHome,
  FiInfo,
  FiLogOut,
  FiMail,
  FiMenu,
  FiMessageSquare,
  FiSearch,
  FiShield,
  FiUser,
  FiUsers,
  FiX,
} from "react-icons/fi";
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

const navBase =
  "inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-[15px] font-semibold transition-colors duration-150";
const mobileNavBase =
  "shrink-0 inline-flex items-center gap-1.5 rounded-md border px-3 py-2 text-xs font-medium transition-colors duration-150";

function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const desktopSearchRef = useRef(null);
  const mobileSearchRef = useRef(null);

  const [globalQuery, setGlobalQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [searchResults, setSearchResults] = useState({ users: [], chats: [] });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [resourcesOpen, setResourcesOpen] = useState(false);

  const navStyle = ({ isActive }) =>
    `${navBase} ${
      isActive
        ? "bg-slate-900 text-white"
        : "text-slate-700 hover:bg-slate-100 hover:text-slate-900"
    }`;

  const mobileNavStyle = ({ isActive }) =>
    `${mobileNavBase} ${
      isActive
        ? "border-slate-900 bg-slate-900 text-white"
        : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
    }`;

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

    let cancelled = false;

    const timer = setTimeout(async () => {
      try {
        setSearchLoading(true);
        const res = await api.get("/user/global-search", {
          params: { q: query, limit: 8 },
        });
        if (cancelled) return;
        setSearchResults({
          users: res.data?.users || [],
          chats: res.data?.chats || [],
        });
        setSearchError("");
      } catch (err) {
        if (cancelled) return;
        setSearchResults({ users: [], chats: [] });
        setSearchError(getErrorMessage(err, "Could not fetch search results"));
      } finally {
        if (cancelled) return;
        setSearchLoading(false);
      }
    }, 220);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [globalQuery, user]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      const insideDesktop = desktopSearchRef.current?.contains(event.target);
      const insideMobile = mobileSearchRef.current?.contains(event.target);
      if (!insideDesktop && !insideMobile) setSearchOpen(false);
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
    setResourcesOpen(false);
  }, [location]);

  const clearSearch = () => {
    setGlobalQuery("");
    setSearchOpen(false);
    setSearchLoading(false);
    setSearchError("");
    setSearchResults({ users: [], chats: [] });
  };

  const onLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const openProfileResult = (id) => {
    if (!id) return;
    navigate(`/profile/visit/${id}`);
    clearSearch();
  };

  const openChatResult = (target, source = "user") => {
    if (!target?._id) return;

    const targetRole = normalizeRole(target.role);
    const isStudentAlumniPair =
      (user?.role === "student" && targetRole === "alumni") ||
      (user?.role === "alumni" && targetRole === "student");

    if (source === "user" && isStudentAlumniPair) {
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
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18 }}
      className="absolute left-0 top-full z-[70] mt-2 w-full rounded-lg border border-slate-200 bg-white p-2 shadow-xl shadow-slate-200/50"
    >
      {searchLoading && <p className="px-2 py-2 text-xs text-slate-500">Searching...</p>}
      {!searchLoading && searchError && <p className="px-2 py-2 text-xs text-red-600">{searchError}</p>}

      {!searchLoading && !searchError && (
        <div className="max-h-[340px] space-y-2 overflow-y-auto">
          {searchResults.users?.length > 0 && (
            <div>
              <p className="px-2 py-1 text-[11px] uppercase tracking-wider text-slate-500">People</p>
              {searchResults.users.map((item) => (
                <div
                  key={`user-${item._id}`}
                  className="flex items-center gap-2 rounded-md px-2 py-2 hover:bg-slate-50"
                >
                  <button
                    type="button"
                    onClick={() => openProfileResult(item._id)}
                    className="flex-1 text-left"
                  >
                    <p className="truncate text-sm font-medium text-slate-800">{item.name}</p>
                    <p className="truncate text-[11px] text-slate-500">
                      {roleLabel(item.role)} | {item.prn || item.instituteCode || item.email}
                    </p>
                  </button>
                  <button
                    type="button"
                    onClick={() => openChatResult(item, "user")}
                    className="rounded-md border border-emerald-300 px-2 py-1 text-[11px] text-emerald-700 hover:bg-emerald-50"
                  >
                    {((user?.role === "student" && normalizeRole(item.role) === "alumni") ||
                      (user?.role === "alumni" && normalizeRole(item.role) === "student"))
                      ? "Profile"
                      : "Chat"}
                  </button>
                </div>
              ))}
            </div>
          )}

          {searchResults.chats?.length > 0 && (
            <div>
              <p className="px-2 py-1 text-[11px] uppercase tracking-wider text-slate-500">Recent Chats</p>
              {searchResults.chats.map((item, index) => (
                <button
                  key={`chat-${item.user?._id || index}`}
                  type="button"
                  onClick={() => openChatResult(item.user, "chat")}
                  className="w-full rounded-md px-2 py-2 text-left hover:bg-slate-50"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-800">{item.user?.name || "Chat User"}</p>
                      <p className="truncate text-[11px] text-slate-500">{item.lastMessage || "Open conversation"}</p>
                    </div>
                    <span className="inline-flex shrink-0 items-center gap-1 text-[10px] text-slate-400">
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
            <p className="px-2 py-2 text-xs text-slate-500">Search alumni, students, admins, or chats.</p>
          )}
        </div>
      )}
    </motion.div>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-white/85">
      <div className="mx-auto flex h-[78px] sm:h-[84px] max-w-7xl items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.35 }}>
          <NavLink to="/" className="group flex min-w-0 items-center gap-3">
            <div className="relative">
              <img
                src={logo}
                alt="AlumHub Logo"
                className="h-12 w-12 rounded-xl border border-slate-200 object-cover transition group-hover:border-slate-300"
              />
              <div className="pointer-events-none absolute -bottom-1 -right-1 h-3 w-3 rounded-full border border-white bg-emerald-500" />
            </div>
            <div className="min-w-0">
              <p className="truncate text-xl sm:text-2xl font-black tracking-tight text-slate-900 md:text-[2rem]">AlumHub</p>
              <p className="truncate text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.13em] sm:tracking-[0.15em] text-slate-500">
                Alumni Network Platform
              </p>
            </div>
          </NavLink>
        </motion.div>

        {user && (
          <motion.div
            ref={desktopSearchRef}
            className="relative hidden max-w-xl flex-1 md:block"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, delay: 0.08 }}
          >
            <FiSearch className="absolute left-3 top-3 text-slate-400" size={14} />
            <input
              value={globalQuery}
              onChange={(e) => {
                setGlobalQuery(e.target.value);
                setSearchOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchResults.users?.[0]?._id) {
                  openProfileResult(searchResults.users[0]._id);
                }
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search people or messages"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 pl-9 text-sm text-slate-800 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
            {searchOpen && searchDropdown}
          </motion.div>
        )}

        <motion.nav
          className="hidden items-center gap-1 lg:flex"
          initial={{ opacity: 0, x: 12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.35, delay: 0.12 }}
        >
          {!user && (
            <>
              <NavLink to="/" className={navStyle}>
                <FiHome size={15} /> Home
              </NavLink>

              <div className="group relative">
                <button className={`${navBase} text-slate-700 hover:bg-slate-100 hover:text-slate-900`}>
                  <FiInfo size={15} /> Resources
                  <FiChevronDown size={13} className="transition-transform group-hover:rotate-180" />
                </button>
                <div className="invisible absolute left-0 top-full z-40 mt-2 w-52 rounded-lg border border-slate-200 bg-white p-1 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100">
                  <button
                    onClick={() => navigate("/#features")}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                  >
                    <FiAward size={14} /> Features
                  </button>
                  <button
                    onClick={() => navigate("/#about")}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                  >
                    <FiInfo size={14} /> About Us
                  </button>
                  <button
                    onClick={() => navigate("/#contact")}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                  >
                    <FiMail size={14} /> Contact
                  </button>
                </div>
              </div>

              <NavLink to="/login" className={navStyle}>
                <FiUser size={15} /> Login
              </NavLink>
              <NavLink
                to="/signup"
                className="inline-flex items-center gap-2 rounded-md border border-slate-900 bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800"
              >
                <FiUsers size={15} /> Join Network
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
              {(user.role === "student" || user.role === "admin") && (
                <NavLink to="/alumni-directory" className={navStyle}>
                  <FiUsers size={15} /> Alumni
                </NavLink>
              )}
              <NavLink to="/profile" className={navStyle}>
                <FiUser size={15} /> Profile
              </NavLink>
              <NavLink to="/feedback" className={navStyle}>
                <FiMessageSquare size={15} /> Feedback
              </NavLink>

              <div className="group relative">
                <button className={`${navBase} text-slate-700 hover:bg-slate-100 hover:text-slate-900`}>
                  <FiInfo size={15} /> More
                  <FiChevronDown size={13} className="transition-transform group-hover:rotate-180" />
                </button>
                <div className="invisible absolute right-0 top-full z-40 mt-2 w-52 rounded-lg border border-slate-200 bg-white p-1 opacity-0 shadow-lg transition group-hover:visible group-hover:opacity-100">
                  <button
                    onClick={() => navigate("/")}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                  >
                    <FiHome size={14} /> About Us
                  </button>
                  <button
                    onClick={() => navigate("/")}
                    className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                  >
                    <FiMail size={14} /> Support
                  </button>
                </div>
              </div>

              <NotificationBell />

              <span className="rounded-md border border-slate-200 bg-slate-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-600">
                {roleLabel(user.role)}
              </span>

              <button
                onClick={onLogout}
                className="inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-50"
              >
                <FiLogOut size={15} /> Logout
              </button>
            </>
          )}
        </motion.nav>

        <div className="flex items-center gap-2 lg:hidden">
          {!user ? (
            <>
              <NavLink
                to="/login"
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
              >
                Login
              </NavLink>
              <NavLink
                to="/signup"
                className="rounded-md border border-slate-900 bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Join
              </NavLink>
            </>
          ) : (
            <NotificationBell />
          )}

          <button
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            className="rounded-md border border-slate-300 p-2 text-slate-700 hover:bg-slate-50"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <FiX size={18} /> : <FiMenu size={18} />}
          </button>
        </div>
      </div>

      {user && (
        <motion.div
          className="border-t border-slate-200 bg-white lg:hidden"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.22 }}
        >
          <div ref={mobileSearchRef} className="relative px-3 pb-1 pt-3">
            <FiSearch className="absolute left-6 top-5.5 text-slate-400" size={13} />
            <input
              value={globalQuery}
              onChange={(e) => {
                setGlobalQuery(e.target.value);
                setSearchOpen(true);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && searchResults.users?.[0]?._id) {
                  openProfileResult(searchResults.users[0]._id);
                }
              }}
              onFocus={() => setSearchOpen(true)}
              placeholder="Search people or messages"
              className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-8 pr-3 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
            />
            {searchOpen && searchDropdown}
          </div>
          <div className="overflow-x-auto px-3 py-2">
            <nav className="flex min-w-full w-max items-center gap-2">
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
        </motion.div>
      )}

      <motion.div
        className="border-t border-slate-200 bg-white lg:hidden"
        initial={{ opacity: 0, height: 0 }}
        animate={mobileMenuOpen ? { opacity: 1, height: "auto" } : { opacity: 0, height: 0 }}
        transition={{ duration: 0.22 }}
      >
        {!user && (
          <div className="space-y-2 px-4 py-4">
            <NavLink to="/" className="block rounded-md px-2 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50">
              Home
            </NavLink>
            <button
              onClick={() => setResourcesOpen((prev) => !prev)}
              className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Resources
              <FiChevronDown size={14} className={`transition-transform ${resourcesOpen ? "rotate-180" : ""}`} />
            </button>
            {resourcesOpen && (
              <div className="space-y-1 pl-4">
                <button
                  onClick={() => navigate("/#features")}
                  className="block py-1 text-xs text-slate-600 hover:text-slate-900"
                >
                  Features
                </button>
                <button
                  onClick={() => navigate("/#about")}
                  className="block py-1 text-xs text-slate-600 hover:text-slate-900"
                >
                  About Us
                </button>
                <button
                  onClick={() => navigate("/#contact")}
                  className="block py-1 text-xs text-slate-600 hover:text-slate-900"
                >
                  Contact
                </button>
              </div>
            )}
          </div>
        )}

        {user && (
          <div className="space-y-1 px-4 py-4">
            <NavLink to={dashboardPath(user.role)} className="block rounded-md px-2 py-2 text-sm text-slate-700 hover:bg-slate-50">
              Dashboard
            </NavLink>
            <NavLink to="/discussion" className="block rounded-md px-2 py-2 text-sm text-slate-700 hover:bg-slate-50">
              Community
            </NavLink>
            <NavLink to="/events" className="block rounded-md px-2 py-2 text-sm text-slate-700 hover:bg-slate-50">
              Events
            </NavLink>
            <NavLink to="/profile" className="block rounded-md px-2 py-2 text-sm text-slate-700 hover:bg-slate-50">
              Profile
            </NavLink>
            <NavLink to="/feedback" className="block rounded-md px-2 py-2 text-sm text-slate-700 hover:bg-slate-50">
              Feedback
            </NavLink>
            {(user.role === "student" || user.role === "admin") && (
              <NavLink
                to="/alumni-directory"
                className="block rounded-md px-2 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                Alumni Directory
              </NavLink>
            )}
            <button
              onClick={onLogout}
              className="mt-2 inline-flex items-center gap-2 rounded-md border border-red-200 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
            >
              <FiLogOut size={14} /> Logout
            </button>
          </div>
        )}
      </motion.div>
    </header>
  );
}

export default Header;
