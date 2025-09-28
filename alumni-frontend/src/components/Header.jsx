import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import "./Header.css";

export default function Header() {
  const { user, logout } = useAuth();

  return (
    <header className="header">
      <div className="logo">AlumHub</div>
      <nav>
        <ul className="nav-links">
          <li><Link to="/">Home</Link></li>

          {/* Show Dashboard only if logged in */}
          {user && <li>
            <Link to={
              user.role === "student" ? "/dashboard/student" :
              user.role === "alumni" ? "/dashboard/alumni" :
              user.role === "collegeAdmin" ? "/dashboard/college" :
              "/dashboard"
            }>Dashboard</Link>
          </li>}

          {/* Main features */}
          {user && <li><Link to="/discussion">Community Discussion</Link></li>}
          {user && <li><Link to="/chat">Private Chat</Link></li>}
          {user?.role === "collegeAdmin" && <li><Link to="/dashboard/college">Admin Verification</Link></li>}

          {/* Auth buttons */}
          {!user && <li><Link to="/login">Login</Link></li>}
          {!user && <li><Link to="/signup">Signup</Link></li>}
          {user && <li><button onClick={logout}>Logout</button></li>}
        </ul>
      </nav>
    </header>
  );
}
