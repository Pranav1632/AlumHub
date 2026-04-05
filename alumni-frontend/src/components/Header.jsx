import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { FiCalendar, FiHome, FiLogOut, FiMessageSquare, FiUser, FiUsers } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png";
import NotificationBell from "./NotificationBell";

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

export default function Header() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

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
                <FiUsers size={15} /> Community
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
          <div className="px-3 py-2 overflow-x-auto">
            <nav className="flex items-center gap-2 w-max min-w-full">
              <NavLink to={dashboardPath(user.role)} className={mobileNavStyle}>
                <FiHome size={13} /> Dashboard
              </NavLink>
              <NavLink to="/discussion" className={mobileNavStyle}>
                <FiUsers size={13} /> Community
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
