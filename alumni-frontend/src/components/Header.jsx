import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import logo from "../assets/logo.png"; // Adjust path if needed

export default function Header() {
  const { user, logout } = useAuth();

  const navStyle = ({ isActive }) =>
    `text-sm font-medium px-3 py-2 rounded-md transition ${
      isActive ? "bg-blue-600 text-white" : "text-gray-700 hover:bg-gray-100"
    }`;

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
    <div className="flex justify-between items-center h-24"> {/* Taller header */}
      {/* Logo + Title */}
      <NavLink to="/" className="flex items-center space-x-3">
        <img
          src={logo}
          alt="AlumHub Logo"
          className="h-16 w-16 rounded-full object-cover" // Larger logo
        />
        <span className="text-2xl font-bold text-blue-700">AlumHub</span> {/* Bigger title */}
      </NavLink>

      {/* Navigation Links */}
    <nav className="flex items-center space-x-4">
  {!user && <NavLink to="/" className={navStyle}>Home</NavLink>}
  {!user && <NavLink to="/about" className={navStyle}>About Us</NavLink>}  {/* Updated */}
  
  

        {user && (
          <>
            <NavLink
              to={
                user.role === "student" ? "/dashboard/student" :
                user.role === "alumni" ? "/dashboard/alumni" :
                user.role === "collegeAdmin" ? "/dashboard/college" :
                "/dashboard"
              }
              className={navStyle}
            >
              Dashboard
            </NavLink>
            <NavLink to="/discussion" className={navStyle}>Discussion</NavLink>
            <NavLink to="/chat" className={navStyle}>Chat</NavLink>
            <NavLink to="/alumni-directory" className={navStyle}>Alumni</NavLink>
            <NavLink to="/job-board" className={navStyle}>Jobs</NavLink>
            <NavLink to="/calendar" className={navStyle}>Events</NavLink>
            <NavLink to="/profile" className={navStyle}>Profile</NavLink>
            <NavLink to="/feedback" className={navStyle}>Feedback</NavLink>
            {user.role === "collegeAdmin" && (
              <NavLink to="/dashboard/college" className={navStyle}>Admin</NavLink>
            )}
          </>
        )}

        {!user ? (
          <>
            <NavLink to="/login" className={navStyle}>Login</NavLink>
            <NavLink to="/signup" className={navStyle}>Signup</NavLink>
          </>
        ) : (
          <button
            onClick={logout}
            className="text-sm font-medium px-3 py-2 rounded-md text-red-600 hover:bg-red-100 transition"
          >
            Logout
          </button>
        )}
      </nav>

      {/* Search Bar */}
      <div className="hidden md:flex items-center ml-4">
        <input
          type="text"
          placeholder="Search AlumHub..."
          className="px-3 py-2 border border-gray-300 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  </div>
</header>
  );
}