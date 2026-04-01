import React from "react";
import { Link } from "react-router-dom";
import { FiArrowRight, FiLock, FiUsers } from "react-icons/fi";
import backgroundImage from "./image/backgroundalum.jpg";

export default function Home() {
  return (
    <div
      className="relative min-h-[76vh] rounded-2xl overflow-hidden border border-slate-200"
      style={{
        backgroundImage: `linear-gradient(to right, rgba(15,23,42,0.85), rgba(30,64,175,0.55)), url(${backgroundImage})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      <div className="max-w-6xl mx-auto px-6 py-16 md:py-24 text-white">
        <div className="max-w-3xl">
          <p className="inline-flex items-center gap-2 text-xs uppercase tracking-wide bg-white/10 border border-white/20 rounded-full px-3 py-1 mb-5">
            <FiLock size={12} /> College-wise secure platform
          </p>
          <h1 className="text-4xl md:text-5xl font-bold leading-tight">
            Connect Students, Alumni, and Admins in one tenant-safe portal.
          </h1>
          <p className="mt-5 text-blue-100 text-base md:text-lg">
            Login by role, collaborate through events and discussions, and use production-style private chat with strict
            college data isolation.
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg bg-white text-slate-900 font-semibold hover:bg-slate-100"
            >
              Login <FiArrowRight size={16} />
            </Link>
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-lg border border-white/40 text-white font-semibold hover:bg-white/10"
            >
              Student/Alumni Signup <FiUsers size={16} />
            </Link>
          </div>

          <div className="mt-8 grid sm:grid-cols-3 gap-3 text-sm">
            <div className="bg-white/10 border border-white/20 rounded-lg p-3">Tenant Isolation via <code>collegeId</code></div>
            <div className="bg-white/10 border border-white/20 rounded-lg p-3">Role-specific Portals</div>
            <div className="bg-white/10 border border-white/20 rounded-lg p-3">Real-time Chat + Read Receipts</div>
          </div>
        </div>
      </div>
    </div>
  );
}