// src/pages/dashboards/StudentDashboard.jsx
import React, { useState, useEffect } from "react";
import EventCalendar from "../../components/EventCalender"; // Keep your existing EventCalendar component
import { Link } from "react-router-dom";
import "../../components/css/home.css"

export default function StudentDashboard() {
  // For carousel
  const [currentSlide, setCurrentSlide] = useState(0);
  const slides = [
    {
      img: "/alumni-spotlight-1.jpg",
      title: "Dr. Ashitosh ",
      desc: '"Innovation is seeing what everybody has seen and thinking what nobody has thought."',
      btn: "View Profile",
    },
    {
      img: "/student-project-1.jpg",
      title: "Student Project: Eco-Drone",
      desc: '"Revolutionizing environmental monitoring with autonomous drone technology."',
      btn: "Learn More",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [slides.length]);

  return (
    <div className="portal-wrapper">
      <header className="main-navbar">
        <div className="navbar-left">
          <button className="menu-toggle-btn">
            <i className="fas fa-bars"></i>
          </button>
          <div className="nav-brand">AlumHub</div>
          <nav className="main-nav-links">
            <Link to="/dashboard/student" className="nav-link active">
              Dashboard
            </Link>
            <Link to="/alumni-directory" className="nav-link">
              Alumni
            </Link>
            <Link to="/chat" className="nav-link">
              Messaging
            </Link>
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
          <Link to="/profile" className="icon-button profile-icon-link">
            <img
              src="https://avatar.iran.liara.run/public/36"
              alt="User Profile"
              className="navbar-profile-img"
            />
          </Link>
        </div>
      </header>

      <main className="dashboard-layout">
        <aside className="sidebar-left dashboard-sidebar">
          <nav className="sidebar-nav">
            <Link to="/dashboard/student" className="sidebar-item active">
              <i className="fas fa-chart-line"></i> Dashboard
            </Link>
            <Link to="/job-board" className="sidebar-item">
              <i className="fas fa-briefcase"></i> Job Board
            </Link>
            <Link to="/events" className="sidebar-item">
              <i className="fas fa-calendar-alt"></i> Events
            </Link>
          </nav>
          <div className="sidebar-footer">
            <Link to="/settings" className="sidebar-item">
              <i className="fas fa-cog"></i> Settings
            </Link>
            <Link to="/logout" className="sidebar-item logout">
              <i className="fas fa-sign-out-alt"></i> Logout
            </Link>
          </div>
        </aside>

        <section className="dashboard-content">
          {/* Hero Welcome Card */}
          <div className="hero-welcome-card">
            <div className="hero-background-video">
              <video autoPlay loop muted playsInline src="/campus-life-bg.mp4" />
              <div className="video-overlay"></div>
            </div>
            <div className="hero-content">
              <h1 className="welcome-heading">
                Good Morning, <span className="user-name">Pranav Gaikwad</span>!
              </h1>
              <p className="welcome-message">
                Ready to make today productive? Your personalized dashboard awaits.
              </p>
              <div className="announcement-marquee">
                <i className="fas fa-bullhorn"></i>
                <span>
                  New internship opportunities just posted! Check the Job Board for
                  details.
                </span>
              </div>
            </div>
          </div>

          {/* Dashboard Grid */}
          <div className="dashboard-grid">
            {/* Pulse Card */}
            <div className="dashboard-card pulse-card">
              <h3>
                <i className="fas fa-newspaper icon-pulse"></i> Pulse of the Campus
              </h3>
              <div className="feed-item">
                <p>
                  <strong>Dr. Sarah Lee</strong> published new research on
                  sustainable energy. <span className="feed-timestamp">2h ago</span>
                </p>
                <span className="feed-category">#Research #Alumni</span>
              </div>
              <div className="feed-item">
                <p>
                  <strong>Student Union</strong> hosting "InnovateFest 2024" this
                  Friday! <span className="feed-timestamp">1d ago</span>
                </p>
                <span className="feed-category">#Events #Students</span>
              </div>
              <Link to="#" className="card-link">
                View All News <i className="fas fa-arrow-right"></i>
              </Link>
            </div>

            {/* Community Card */}
            <div className="dashboard-card community-card">
              <h3>
                <i className="fas fa-comments icon-community"></i> Community Board
              </h3>
              <div className="community-post-item">
                <p>
                  <strong>New post:</strong> "Tips for your first startup funding
                  round?" by Alex M. <span className="post-timestamp">3h ago</span>
                </p>
                <span className="post-tags">#Entrepreneurship #Funding</span>
              </div>
              <div className="community-post-item">
                <p>
                  <strong>Thread:</strong> "Best resources for learning Quantum
                  Computing?" <span className="post-timestamp">8h ago</span>
                </p>
                <span className="post-tags">#Tech #Learning</span>
              </div>
              <button className="card-action-btn">Ask a Question</button>
              <Link to="/discussion" className="card-link">
                View All Discussions <i className="fas fa-arrow-right"></i>
              </Link>
            </div>

            {/* Spotlight Carousel */}
            <div className="dashboard-card spotlight-card">
              <h3>
                <i className="fas fa-star icon-spotlight"></i> Spotlight Gallery
              </h3>
              <div className="spotlight-carousel">
                {slides.map((slide, index) => (
                  <div
                    key={index}
                    className={`carousel-item ${index === currentSlide ? "active" : ""}`}
                  >
                    <img src={slide.img} alt={slide.title} className="spotlight-img" />
                    <div className="spotlight-info">
                      <h4>{slide.title}</h4>
                      <p>{slide.desc}</p>
                      <button className="card-action-btn">{slide.btn}</button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="carousel-nav">
                {slides.map((_, idx) => (
                  <span
                    key={idx}
                    className={`dot ${idx === currentSlide ? "active" : ""}`}
                    onClick={() => setCurrentSlide(idx)}
                  ></span>
                ))}
              </div>
            </div>

            {/* Event Card */}
            {/* Event Card */}
<div className="dashboard-card event-card" style={{ gridColumn: "span 1" }}>
  <h3>
    <i className="fas fa-calendar-days icon-event"></i> Upcoming Events
  </h3>
  <div className="calendar-wrapper " style={{ gridColumn: "span 2" }}>
    <EventCalendar />
  </div>
  <Link to="/events" className="card-link">
    Full Calendar <i className="fas fa-arrow-right"></i>
  </Link>
</div>

          </div>
        </section>
      </main>
    </div>
  );
}
