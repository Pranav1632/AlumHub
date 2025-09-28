// src/pages/AlumniDirectory.jsx
import React from "react";
import "./css-pages/alumni-page.css"
export default function AlumniDirectory() {
  return (
    <div className="portal-wrapper">
      <header className="main-navbar">
        <div className="navbar-left">
          <button className="menu-toggle-btn">
            <i className="fas fa-bars"></i>
          </button>
          <div className="nav-brand">AlumHub</div>
          <nav className="main-nav-links">
            <a href="home.html" className="nav-link">Home</a>
            <a href="#" className="nav-link active">Alumni</a>
            <a href="private-messaging.html" className="nav-link">Messaging</a>
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
          <a href="profile.html" className="icon-button notification-bell">
            <i className="fas fa-bell"></i>
          </a>
          <a href="#" id="userProfileLink" className="icon-button profile-icon-link">
            <img
              src="https://avatar.iran.liara.run/public/36"
              alt="User Profile"
              className="navbar-profile-img"
            />
          </a>
        </div>
      </header>

      <main className="alumni-page-layout">
        <section className="alumni-list-container">
          <div className="alumni-controls">
            <div className="filter-sort-group">
              <button className="control-btn filter-sort-btn">
                <i className="fas fa-filter"></i> Filter
              </button>
              <button className="control-btn filter-sort-btn">
                <i className="fas fa-sort"></i> Sort
              </button>
            </div>
            <div className="search-alumni-container">
              <input
                type="text"
                placeholder="Search Alumni..."
                className="alumni-search-input"
              />
              <i className="fas fa-search search-icon"></i>
            </div>
          </div>

          <div className="alumni-table-wrapper card">
            <table>
              <thead>
                <tr>
                  <th>Sr</th>
                  <th>Name</th>
                  <th>Branch</th>
                  <th>Working</th>
                  <th>Batch</th>
                  <th>Company</th>
                  <th>Type</th>
                </tr>
              </thead>
              <tbody>
                <tr className="alumni-row active">
                  <td>1</td>
                  <td>John Doe</td>
                  <td>Computer Science</td>
                  <td>Yes</td>
                  <td>2018</td>
                  <td>Tech Innovators Inc.</td>
                  <td>Full-time</td>
                </tr>
                <tr className="alumni-row">
                  <td>2</td>
                  <td>Jane Smith</td>
                  <td>Electrical Eng.</td>
                  <td>Yes</td>
                  <td>2019</td>
                  <td>Global Circuits Ltd.</td>
                  <td>Full-time</td>
                </tr>
                <tr className="alumni-row">
                  <td>3</td>
                  <td>Alex M.</td>
                  <td>Business Admin.</td>
                  <td>No</td>
                  <td>2020</td>
                  <td>(Student)</td>
                  <td>Intern</td>
                </tr>
                <tr className="alumni-row">
                  <td>4</td>
                  <td>Emily White</td>
                  <td>Mechanical Eng.</td>
                  <td>Yes</td>
                  <td>2017</td>
                  <td>Auto Robotics Co.</td>
                  <td>Contract</td>
                </tr>
                <tr className="alumni-row">
                  <td>5</td>
                  <td>Chris Brown</td>
                  <td>Civil Eng.</td>
                  <td>Yes</td>
                  <td>2016</td>
                  <td>Urban Builders LLC</td>
                  <td>Full-time</td>
                </tr>
                <tr className="alumni-row">
                  <td>6</td>
                  <td>Sarah Green</td>
                  <td>Architecture</td>
                  <td>No</td>
                  <td>2021</td>
                  <td>(Unemployed)</td>
                  <td>N/A</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <aside className="alumni-details-sidebar">
          <div className="sidebar-card card">
            <div className="alumni-profile-header">
              <img
                src="https://avatar.iran.liara.run/public/13"
                alt="Alumni Profile"
                className="alumni-detail-img"
              />
              <h3>John Doe</h3>
              <p className="alumni-meta-info">CS '18 | Tech Innovators Inc.</p>
            </div>
            <div className="brief-details">
              <h4>Brief Details:</h4>
              <ul>
                <li><strong>Branch:</strong> Computer Science</li>
                <li><strong>Batch:</strong> 2018</li>
                <li><strong>Current Company:</strong> Tech Innovators Inc.</li>
                <li><strong>Position:</strong> Software Engineer</li>
                <li><strong>Location:</strong> San Francisco, CA</li>
              </ul>
            </div>
            <a href="#" className="card-link">
              View Full Profile <i className="fas fa-arrow-right"></i>
            </a>
          </div>
        </aside>
      </main>
    </div>
  );
}
