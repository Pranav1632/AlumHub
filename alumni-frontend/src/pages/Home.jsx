import React, { useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, useScroll, useSpring } from "framer-motion";
import {
  FiArrowRight,
  FiAward,
  FiCalendar,
  FiCheckCircle,
  FiGlobe,
  FiLock,
  FiMail,
  FiMessageSquare,
  FiShield,
  FiTrendingUp,
  FiUsers,
  FiZap,
} from "react-icons/fi";
import backgroundImage from "./image/backgroundalum.jpg";

const features = [
  {
    icon: FiAward,
    title: "Structured Mentorship",
    description:
      "Students request guidance by field and alumni respond based on proven expertise and availability.",
  },
  {
    icon: FiUsers,
    title: "Searchable Alumni Directory",
    description:
      "Filter mentors by skill set, location, graduation year, and domain to find the right match quickly.",
  },
  {
    icon: FiMessageSquare,
    title: "Integrated Communication",
    description:
      "Secure real-time chat and conversation history keep every mentoring interaction clear and reliable.",
  },
  {
    icon: FiTrendingUp,
    title: "Progress Tracking",
    description:
      "Monitor mentorship requests, outcomes, and engagement data to improve student-alumni outcomes.",
  },
  {
    icon: FiCalendar,
    title: "Events and Sessions",
    description:
      "Run networking events, webinars, and college activities with controlled access and clear registration.",
  },
  {
    icon: FiShield,
    title: "Role-Based Security",
    description:
      "College-scoped authorization and approval workflows protect conversations and profile authenticity.",
  },
];

const processSteps = [
  {
    step: "01",
    title: "Create Profile",
    description: "Students and alumni register with verified identity and professional context.",
  },
  {
    step: "02",
    title: "Match Intelligently",
    description: "Suggestions are ranked using skills, industry, availability, and mentorship preferences.",
  },
  {
    step: "03",
    title: "Collaborate",
    description: "Connect through chat, event touchpoints, and guided mentorship goals.",
  },
  {
    step: "04",
    title: "Measure Growth",
    description: "Track outcomes with feedback loops and actionable institutional insights.",
  },
];

const scoringFactors = [
  { label: "Skill Overlap", value: 30 },
  { label: "Industry Alignment", value: 25 },
  { label: "Availability Window", value: 20 },
  { label: "Geographic Proximity", value: 15 },
  { label: "Mentorship Preference", value: 10 },
];

const trustTicker = [
  "Mentorship Lifecycle Management",
  "Searchable Mentor Discovery",
  "Institution-Level Data Isolation",
  "Secure Real-Time Messaging",
  "Admin Moderation Workflows",
  "Outcome Analytics Dashboard",
];

const sectionVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.55,
      ease: "easeOut",
    },
  },
};

function NetworkOrb() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    let rafId = null;
    let rotation = 0;
    let size = 320;

    const resize = () => {
      const parentWidth = canvas.parentElement?.getBoundingClientRect().width || 320;
      size = Math.max(240, Math.min(360, Math.floor(parentWidth)));
      const dpr = window.devicePixelRatio || 1;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = `${size}px`;
      canvas.style.height = `${size}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = () => {
      const center = size / 2;
      const radius = size * 0.28;
      ctx.clearRect(0, 0, size, size);

      const shellGradient = ctx.createRadialGradient(center - 20, center - 24, 0, center, center, radius + 50);
      shellGradient.addColorStop(0, "rgba(148, 163, 184, 0.35)");
      shellGradient.addColorStop(1, "rgba(15, 23, 42, 0)");
      ctx.fillStyle = shellGradient;
      ctx.beginPath();
      ctx.arc(center, center, radius + 45, 0, Math.PI * 2);
      ctx.fill();

      const globeGradient = ctx.createRadialGradient(center - 16, center - 16, 0, center, center, radius);
      globeGradient.addColorStop(0, "#e2e8f0");
      globeGradient.addColorStop(0.55, "#cbd5e1");
      globeGradient.addColorStop(1, "#64748b");
      ctx.fillStyle = globeGradient;
      ctx.beginPath();
      ctx.arc(center, center, radius, 0, Math.PI * 2);
      ctx.fill();

      ctx.strokeStyle = "rgba(30, 64, 175, 0.32)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.ellipse(center, center, radius * 0.95, radius * 0.35, rotation * 1.5, 0, Math.PI * 2);
      ctx.stroke();

      ctx.beginPath();
      ctx.ellipse(center, center, radius * 0.95, radius * 0.35, -rotation * 1.2, 0, Math.PI * 2);
      ctx.stroke();

      const nodes = 14;
      for (let i = 0; i < nodes; i += 1) {
        const angle = (i / nodes) * Math.PI * 2 + rotation;
        const x = center + Math.cos(angle) * radius * 0.65;
        const y = center + Math.sin(angle) * radius * 0.3;

        ctx.strokeStyle = "rgba(51, 65, 85, 0.35)";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(center, center);
        ctx.lineTo(x, y);
        ctx.stroke();

        ctx.fillStyle = i % 4 === 0 ? "rgba(30, 64, 175, 0.9)" : "rgba(241, 245, 249, 0.95)";
        ctx.beginPath();
        ctx.arc(x, y, i % 4 === 0 ? 3.4 : 2.6, 0, Math.PI * 2);
        ctx.fill();
      }

      rotation += 0.008;
      rafId = requestAnimationFrame(draw);
    };

    resize();
    draw();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return <canvas ref={canvasRef} className="mx-auto block w-full max-w-[360px]" />;
}

function FeatureCard({ icon: Icon, title, description }) {
  return (
    <motion.article
      whileHover={{ y: -8, rotateX: 5, rotateY: -6 }}
      transition={{ type: "spring", stiffness: 130, damping: 14 }}
      className="group relative h-full rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
      style={{ transformStyle: "preserve-3d" }}
    >
      <div className="pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br from-sky-50/70 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
      <div className="relative z-10">
        <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-slate-50 text-slate-700">
          <Icon size={20} />
        </div>
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        <p className="mt-2 text-sm leading-relaxed text-slate-600">{description}</p>
      </div>
    </motion.article>
  );
}

export default function Home() {
  const location = useLocation();
  const { scrollYProgress } = useScroll();
  const progressScale = useSpring(scrollYProgress, {
    stiffness: 130,
    damping: 24,
    mass: 0.2,
  });

  useEffect(() => {
    if (!location.hash) return;
    const id = location.hash.replace("#", "");
    const target = document.getElementById(id);
    if (!target) return;
    const timer = setTimeout(() => {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 80);
    return () => clearTimeout(timer);
  }, [location.hash]);

  return (
    <div className="-mx-2 -my-3 min-h-screen bg-[radial-gradient(circle_at_top,_#f8fafc_0%,_#f1f5f9_42%,_#eef2f7_100%)] text-slate-900 sm:-mx-4 md:-mx-6">
      <motion.div
          className="pointer-events-none fixed left-0 right-0 top-[78px] sm:top-[84px] z-40 h-[3px] origin-left bg-gradient-to-r from-slate-800 via-slate-600 to-sky-600/80"
        style={{ scaleX: progressScale }}
      />

      <section className="px-4 pb-14 pt-8 sm:px-6 lg:px-8">
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-lg shadow-slate-200/70">
          <div
            className="absolute inset-0 bg-cover bg-center opacity-[0.16] grayscale"
            style={{ backgroundImage: `url(${backgroundImage})` }}
          />
          <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full bg-sky-200/35 blur-3xl" />
          <div className="absolute -bottom-24 -left-20 h-64 w-64 rounded-full bg-amber-100/70 blur-3xl" />

          <div className="relative grid gap-10 px-5 py-10 sm:px-8 lg:grid-cols-2 lg:gap-12 lg:px-12 lg:py-14">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={sectionVariants}
              className="max-w-2xl"
            >
              <p className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-slate-100 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-slate-700">
                <FiLock size={12} /> Verified Mentorship Infrastructure
              </p>

              <h1 className="mt-5 text-4xl font-black leading-tight text-slate-900 sm:text-5xl lg:text-[3.5rem]">
                A Formal Bridge Between
                <span className="block text-slate-700">Students and Alumni</span>
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-slate-600 sm:text-lg">
                AlumHub centralizes mentorship, networking, and professional guidance in one
                institution-focused platform with role-based access, secure communication, and measurable outcomes.
              </p>

              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link
                  to="/signup"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
                >
                  Create Account <FiArrowRight size={16} />
                </Link>
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-bold text-slate-700 transition hover:border-slate-400 hover:text-slate-900"
                >
                  Sign In
                </Link>
              </div>

              <div className="mt-8 grid grid-cols-3 gap-3">
                {[
                  { icon: FiUsers, title: "Role-Based", subtitle: "Student | Alumni | Admin" },
                  { icon: FiZap, title: "Real-Time", subtitle: "Private Messaging" },
                  { icon: FiShield, title: "Secure", subtitle: "College Scoped Access" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.title}
                      whileHover={{ y: -4 }}
                      className="rounded-xl border border-slate-200 bg-white/95 p-3"
                    >
                      <Icon className="mb-2 text-slate-700" size={18} />
                      <p className="text-xs font-bold uppercase tracking-wider text-slate-700">{item.title}</p>
                      <p className="mt-1 text-[11px] leading-relaxed text-slate-500">{item.subtitle}</p>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.55, delay: 0.15 }}
              className="relative"
            >
              <div className="rounded-3xl border border-slate-200 bg-gradient-to-b from-slate-50 to-white p-6 shadow-inner">
                <NetworkOrb />
              </div>

              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3.3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -left-2 top-8 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-md"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Match Quality</p>
                <p className="text-sm font-bold text-slate-800">Top-3 Smart Suggestions</p>
              </motion.div>

              <motion.div
                animate={{ y: [0, 8, 0] }}
                transition={{ duration: 3.8, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                className="absolute -bottom-4 right-0 rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-md"
              >
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">Communication</p>
                <p className="text-sm font-bold text-slate-800">Chat + Events + Feedback</p>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <motion.div
            className="flex w-max gap-3 px-4 py-4"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 22, repeat: Infinity, ease: "linear" }}
          >
            {[...trustTicker, ...trustTicker].map((item, index) => (
              <span
                key={`${item}-${index}`}
                className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600"
              >
                {item}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      <section id="features" className="scroll-mt-32 px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={sectionVariants}
            className="mb-10 text-center"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Platform Capabilities</p>
            <h2 className="mt-2 text-3xl font-black text-slate-900 md:text-5xl">Built for Reliable Alumni Engagement</h2>
            <p className="mx-auto mt-4 max-w-3xl text-slate-600">
              These capabilities are aligned to the project goals: structured mentorship, searchable discovery,
              communication continuity, and measurable student growth.
            </p>
          </motion.div>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" style={{ perspective: 1200 }}>
            {features.map((item) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 26 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45 }}
              >
                <FeatureCard icon={item.icon} title={item.title} description={item.description} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="about" className="scroll-mt-32 px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-7 lg:grid-cols-[1.2fr_0.8fr]">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={sectionVariants}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Process Flow</p>
            <h3 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">From Registration to Measurable Impact</h3>

            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              {processSteps.map((item) => (
                <motion.div
                  key={item.step}
                  whileHover={{ y: -4 }}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-4"
                >
                  <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Step {item.step}</p>
                  <h4 className="mt-2 text-lg font-bold text-slate-900">{item.title}</h4>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{item.description}</p>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={sectionVariants}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">Matching Engine</p>
            <h3 className="mt-2 text-2xl font-black text-slate-900 sm:text-3xl">Ranking Factors</h3>
            <p className="mt-3 text-sm leading-relaxed text-slate-600">
              AlumHub prioritizes relevance with weighted scoring and presents top-ranked mentor matches for action.
            </p>

            <div className="mt-6 space-y-4">
              {scoringFactors.map((factor) => (
                <div key={factor.label}>
                  <div className="mb-1 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <span>{factor.label}</span>
                    <span>{factor.value}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-slate-200">
                    <motion.div
                      className="h-2 rounded-full bg-gradient-to-r from-slate-700 to-sky-700"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${factor.value}%` }}
                      viewport={{ once: true, amount: 0.6 }}
                      transition={{ duration: 0.7 }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-700">
                Output:
                <span className="ml-2 font-normal text-slate-600">
                  top-3 suggested alumni profiles with manual override support for administrators.
                </span>
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-3xl border border-slate-200 bg-white px-6 py-9 shadow-sm sm:px-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={sectionVariants}
            className="grid gap-8 lg:grid-cols-2"
          >
            <div>
              <h3 className="text-2xl font-black text-slate-900 sm:text-3xl">Value for Every Stakeholder</h3>
              <ul className="mt-5 space-y-3 text-sm leading-relaxed text-slate-600">
                <li className="flex items-start gap-3">
                  <FiCheckCircle className="mt-0.5 text-slate-700" size={18} />
                  Students gain access to verified mentors and practical career guidance.
                </li>
                <li className="flex items-start gap-3">
                  <FiCheckCircle className="mt-0.5 text-slate-700" size={18} />
                  Alumni contribute meaningfully while staying connected to the institution.
                </li>
                <li className="flex items-start gap-3">
                  <FiCheckCircle className="mt-0.5 text-slate-700" size={18} />
                  Admins monitor participation, quality, and platform-wide trust signals.
                </li>
              </ul>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
              <h4 className="text-sm font-bold uppercase tracking-[0.15em] text-slate-500">Operational Confidence</h4>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {[
                  { icon: FiLock, label: "JWT Authentication" },
                  { icon: FiShield, label: "Role-Based Access" },
                  { icon: FiMail, label: "Verified Workflows" },
                  { icon: FiGlobe, label: "College-Level Isolation" },
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <div key={item.label} className="rounded-xl border border-slate-200 bg-white p-3">
                      <Icon size={18} className="text-slate-700" />
                      <p className="mt-2 text-sm font-semibold text-slate-700">{item.label}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section id="contact" className="scroll-mt-32 px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl rounded-3xl border border-slate-800 bg-gradient-to-r from-slate-900 via-slate-800 to-sky-900 px-6 py-10 text-white sm:px-10">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            variants={sectionVariants}
            className="grid items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]"
          >
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-300">Ready to Start</p>
              <h3 className="mt-2 text-3xl font-black leading-tight sm:text-4xl">
                Build a Stronger Alumni-Student Network
              </h3>
              <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-200 sm:text-base">
                Launch a secure, structured, and measurable mentorship ecosystem designed for your institution.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Link
                to="/signup"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-slate-900 transition hover:bg-slate-100"
              >
                Start Onboarding <FiArrowRight size={16} />
              </Link>
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/35 bg-white/10 px-5 py-3 text-sm font-bold text-white transition hover:bg-white/20"
              >
                Access Platform
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
