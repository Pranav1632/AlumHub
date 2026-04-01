import React from "react";
import { Link } from "react-router-dom";
import { FiGithub, FiGlobe, FiLinkedin } from "react-icons/fi";
import logo from "../assets/logo.png";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white mt-12">
      <div className="max-w-screen-xl mx-auto px-4 py-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <Link to="/" className="flex items-center gap-2">
          <img src={logo} alt="AlumHub" className="h-8 w-8 rounded-full border border-slate-200" />
          <div>
            <p className="font-semibold text-slate-900">AlumHub</p>
            <p className="text-xs text-slate-500">Multi-tenant alumni platform</p>
          </div>
        </Link>

        <div className="text-sm text-slate-600">
          College-scoped RBAC platform for Students, Alumni, and Admin.
        </div>

        <div className="flex items-center gap-3 text-slate-500">
          <a href="https://github.com" target="_blank" rel="noreferrer" className="hover:text-slate-900">
            <FiGithub size={18} />
          </a>
          <a href="https://www.linkedin.com" target="_blank" rel="noreferrer" className="hover:text-slate-900">
            <FiLinkedin size={18} />
          </a>
          <a href="https://www.alumhub.demo" target="_blank" rel="noreferrer" className="hover:text-slate-900">
            <FiGlobe size={18} />
          </a>
        </div>
      </div>
    </footer>
  );
}