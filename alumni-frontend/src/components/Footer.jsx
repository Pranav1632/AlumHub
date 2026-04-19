import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { FiArrowUp, FiGithub, FiGlobe, FiLinkedin, FiMail, FiShield, FiUsers } from "react-icons/fi";
import logo from "../assets/logo.png";

export default function Footer() {
  const [showTop, setShowTop] = useState(false);

  useEffect(() => {
    const onScroll = () => setShowTop(window.scrollY > 260);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const toTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  return (
    <footer className="relative mt-14 border-t border-slate-200 bg-slate-950 text-slate-300">
      <div className="absolute inset-x-0 top-0 h-[2px] bg-gradient-to-r from-transparent via-sky-500/70 to-transparent" />

      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.25fr_0.9fr_0.9fr] lg:px-8">
        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
          <Link to="/" className="inline-flex items-center gap-3">
            <img src={logo} alt="AlumHub" className="h-10 w-10 rounded-lg border border-slate-700 object-cover" />
            <div>
              <p className="text-xl font-black text-white">AlumHub</p>
              <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-slate-400">
                Alumni Network Platform
              </p>
            </div>
          </Link>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-slate-400">
            Formal mentorship infrastructure for students, alumni, and administrators with institution-level trust and
            secure collaboration.
          </p>
          <div className="mt-5 flex items-center gap-3 text-slate-400">
            <a href="https://github.com" target="_blank" rel="noreferrer" className="rounded-md border border-slate-700 p-2 transition hover:border-slate-500 hover:text-white">
              <FiGithub size={17} />
            </a>
            <a href="https://www.linkedin.com" target="_blank" rel="noreferrer" className="rounded-md border border-slate-700 p-2 transition hover:border-slate-500 hover:text-white">
              <FiLinkedin size={17} />
            </a>
            <a href="https://www.alumhub.demo" target="_blank" rel="noreferrer" className="rounded-md border border-slate-700 p-2 transition hover:border-slate-500 hover:text-white">
              <FiGlobe size={17} />
            </a>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.08 }}>
          <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-400">Explore</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <Link to="/#features" className="transition hover:text-white">Platform Features</Link>
            </li>
            <li>
              <Link to="/#about" className="transition hover:text-white">How It Works</Link>
            </li>
            <li>
              <Link to="/#contact" className="transition hover:text-white">Contact & Onboarding</Link>
            </li>
            <li>
              <Link to="/login" className="transition hover:text-white">Login</Link>
            </li>
            <li>
              <Link to="/signup" className="transition hover:text-white">Create Account</Link>
            </li>
          </ul>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.14 }}>
          <h3 className="text-sm font-bold uppercase tracking-[0.16em] text-slate-400">Platform Focus</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li className="flex items-start gap-2">
              <FiUsers className="mt-0.5 text-slate-500" size={15} />
              <span>Structured mentorship and alumni discovery.</span>
            </li>
            <li className="flex items-start gap-2">
              <FiShield className="mt-0.5 text-slate-500" size={15} />
              <span>Role-based access and institution-level data boundaries.</span>
            </li>
            <li className="flex items-start gap-2">
              <FiMail className="mt-0.5 text-slate-500" size={15} />
              <span>Integrated communication and measurable outcomes.</span>
            </li>
          </ul>
        </motion.div>
      </div>

      <div className="border-t border-slate-800">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-4 text-xs text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>(c) {new Date().getFullYear()} AlumHub. All rights reserved.</p>
          <p>Privacy | Terms | Accessibility</p>
        </div>
      </div>

      {showTop && (
        <button
          type="button"
          onClick={toTop}
          className="fixed bottom-6 right-5 z-50 inline-flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900/95 px-3 py-2 text-xs font-semibold text-white shadow-lg transition hover:border-slate-500 sm:bottom-7 sm:right-7"
          aria-label="Back to top"
        >
          Top <FiArrowUp size={14} />
        </button>
      )}
    </footer>
  );
}
