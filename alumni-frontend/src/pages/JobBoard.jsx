import React, { useState } from "react";
import "./css-pages/job-board.css"; // style file if you have

export default function JobBoard() {
  // Dummy job data (replace later with API/backend if needed)
  const jobs = [
    {
      id: 1,
      title: "Software Development Intern",
      company: "Tech Innovators LLC",
      type: "internship",
      location: "Remote",
      duration: "3 Months",
      level: "Entry Level",
      deadline: "Dec 15th",
      logo: "https://via.placeholder.com/60x60/673ab7/ffffff?text=TI",
    },
    {
      id: 2,
      title: "Junior Data Scientist",
      company: "Global Analytics Corp",
      type: "fulltime",
      location: "Bangalore, IN",
      salary: "Competitive",
      level: "New Grad",
      deadline: "Nov 30th",
      logo: "https://via.placeholder.com/60x60/f44336/ffffff?text=GA",
    },
    {
      id: 3,
      title: "Content Marketing Intern",
      company: "Creative Connect Agency",
      type: "internship",
      location: "Remote",
      duration: "6 Months",
      language: "English",
      deadline: "Dec 20th",
      logo: "https://via.placeholder.com/60x60/009688/ffffff?text=CC",
    },
    {
      id: 4,
      title: "Library Assistant",
      company: "AlumHub University",
      type: "parttime",
      location: "On-Campus",
      duration: "Flexible Hrs",
      role: "Student Role",
      deadline: "Jan 10th",
      logo: "https://via.placeholder.com/60x60/2196f3/ffffff?text=Univ",
    },
    {
      id: 5,
      title: "Senior UX Designer",
      company: "Innovation Hub Inc.",
      type: "fulltime",
      location: "New York, USA",
      exp: "5+ Years Exp",
      team: "Design Team",
      deadline: "Dec 5th",
      logo: "https://via.placeholder.com/60x60/8bc34a/ffffff?text=Inno",
    },
    {
      id: 6,
      title: "Marketing Strategy Intern",
      company: "Dynamic Marketing Solutions",
      type: "internship",
      location: "Hybrid",
      duration: "4 Months",
      role: "Business Dev",
      deadline: "Jan 1st",
      logo: "https://via.placeholder.com/60x60/ff9800/ffffff?text=Mk",
    },
  ];

  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Filtering + searching
  const filteredJobs = jobs.filter((job) => {
    const matchFilter = filter === "all" || job.type === filter;
    const matchSearch =
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.company.toLowerCase().includes(search.toLowerCase()) ||
      job.type.toLowerCase().includes(search.toLowerCase());

    return matchFilter && matchSearch;
  });

  return (
    <div className="portal-wrapper">
      <header className="main-navbar">
        <div className="navbar-left">
          <div className="nav-brand">AlumHub</div>
          <nav className="main-nav-links">
            <a href="/" className="nav-link">Home</a>
            <a href="/alumni-directory" className="nav-link">Alumni</a>
            <a href="/messaging" className="nav-link">Messaging</a>
            <a href="/job-board" className="nav-link active">Job Board</a>
            <a href="/more" className="nav-link">More</a>
          </nav>
        </div>
        <div className="navbar-right">
          <div className="search-container">
            <input
              type="text"
              placeholder="Global Search..."
              className="global-search-input"
            />
            <i className="fas fa-search search-icon"></i>
          </div>
          <a href="/profile" className="icon-button profile-icon-link">
            <img
              src="https://via.placeholder.com/30/3f51b5/ffffff?text=JD"
              alt="User"
              className="navbar-profile-img"
            />
          </a>
        </div>
      </header>

      <main className="job-board-layout">
        <div className="job-board-header-section">
          <h1 className="page-title">
            <i className="fas fa-briefcase"></i> Job Board
          </h1>
          <div className="header-actions">
            <span className="job-count-summary">
              Showing <span>{filteredJobs.length}</span> Active Jobs & Internships
            </span>
            <button className="control-btn post-job-btn">
              <i className="fas fa-plus-circle"></i> Post a Job
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="job-filters-section">
          <div className="quick-filters">
            {["all", "internship", "fulltime", "parttime", "remote", "oncampus"].map(
              (f) => (
                <button
                  key={f}
                  className={`filter-tag ${filter === f ? "active" : ""}`}
                  onClick={() => setFilter(f)}
                >
                  {f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              )
            )}
          </div>
          <div className="search-and-advanced-filters">
            <div className="job-search-container">
              <input
                type="text"
                placeholder="Search by title, company, keyword..."
                className="job-search-input"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <i className="fas fa-search search-icon"></i>
            </div>
            <button className="control-btn advanced-filter-btn">
              <i className="fas fa-sliders-h"></i> Advanced Filters
            </button>
          </div>
        </div>

        {/* Job Cards */}
        <div className="job-listings-grid">
          {filteredJobs.map((job) => (
            <div key={job.id} className={`job-card ${job.type}`}>
              <div className="card-header">
                <img src={job.logo} alt={job.company} className="company-logo" />
                <div className="job-overview">
                  <h3 className="job-title">{job.title}</h3>
                  <p className="company-name">{job.company}</p>
                </div>
                <span className={`job-type-label ${job.type}`}>
                  {job.type.charAt(0).toUpperCase() + job.type.slice(1)}
                </span>
              </div>
              <div className="job-details-summary">
                <p>
                  <i className="fas fa-map-marker-alt"></i> {job.location}
                </p>
                {job.duration && (
                  <p>
                    <i className="fas fa-calendar-alt"></i> {job.duration}
                  </p>
                )}
                {job.salary && (
                  <p>
                    <i className="fas fa-money-bill-wave"></i> {job.salary}
                  </p>
                )}
                {job.level && (
                  <p>
                    <i className="fas fa-briefcase"></i> {job.level}
                  </p>
                )}
              </div>
              <div className="card-footer">
                <span className="deadline">
                  Apply by: <strong>{job.deadline}</strong>
                </span>
                <button className="action-btn apply-btn">
                  Apply <i className="fas fa-arrow-right"></i>
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
