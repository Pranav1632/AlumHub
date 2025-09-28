// src/pages/AlumniDirectory.jsx
import React, { useState } from "react";
import "./css-pages/alumni-page.css";

const alumniList = [
  {
    id: 1,
    name: "John Doe",
    branch: "Computer Science",
    working: "Yes",
    batch: 2018,
    company: "Tech Innovators Inc.",
    type: "Full-time",
    img: "https://avatar.iran.liara.run/public/13",
    position: "Software Engineer",
    location: "San Francisco, CA",
  },
  {
    id: 2,
    name: "Jane Smith",
    branch: "Electrical Eng.",
    working: "Yes",
    batch: 2019,
    company: "Global Circuits Ltd.",
    type: "Full-time",
    img: "https://avatar.iran.liara.run/public/14",
    position: "Project Manager",
    location: "New York, USA",
  },
  {
    id: 3,
    name: "Alex M.",
    branch: "Business Admin.",
    working: "No",
    batch: 2020,
    company: "(Student)",
    type: "Intern",
    img: "https://avatar.iran.liara.run/public/15",
    position: "Intern",
    location: "Boston, USA",
  },
  // Add more alumni as needed
  {
    id: 4,
    name: "Riya Kapoor",
    branch: "Information Technology",
    working: "Yes",
    batch: 2017,
    company: "Infosys",
    type: "Full-time",
    img: "https://avatar.iran.liara.run/public/16",
    position: "Senior Analyst",
    location: "Pune, India",
  },
  {
    id: 5,
    name: "Mohammed A.",
    branch: "Mechanical Eng.",
    working: "Yes",
    batch: 2016,
    company: "GE Motors",
    type: "Full-time",
    img: "https://avatar.iran.liara.run/public/17",
    position: "Design Engineer",
    location: "Dubai, UAE",
  },
  {
    id: 6,
    name: "Sara L.",
    branch: "Civil Eng.",
    working: "No",
    batch: 2021,
    company: "(Student)",
    type: "Intern",
    img: "https://avatar.iran.liara.run/public/18",
    position: "Research Assistant",
    location: "Toronto, Canada",
  },
  {
    id: 7,
    name: "Kunal Deshmukh",
    branch: "Electronics",
    working: "Yes",
    batch: 2015,
    company: "Qualcomm",
    type: "Full-time",
    img: "https://avatar.iran.liara.run/public/19",
    position: "Hardware Architect",
    location: "San Diego, USA",
  },

];

export default function AlumniDirectory() {
  const [selectedAlumni, setSelectedAlumni] = useState(null);

  const handleRowClick = (alumni) => {
    setSelectedAlumni(alumni); // simply replace the previous one
  };

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
        {/* Alumni List */}
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
                {alumniList.map((alumni, index) => (
                  <tr
                    key={alumni.id}
                    className="alumni-row cursor-pointer hover:bg-gray-100"
                    onClick={() => handleRowClick(alumni)}
                  >
                    <td>{index + 1}</td>
                    <td>{alumni.name}</td>
                    <td>{alumni.branch}</td>
                    <td>{alumni.working}</td>
                    <td>{alumni.batch}</td>
                    <td>{alumni.company}</td>
                    <td>{alumni.type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Sidebar for Selected Alumni */}
        <aside className="alumni-details-sidebar">
          {!selectedAlumni && (
            <p className="text-gray-500">Click an alumni row to see details here</p>
          )}

          {selectedAlumni && (
            <div className="sidebar-card card">
              <div className="alumni-profile-header flex items-center gap-3">
                <img
                  src={selectedAlumni.img}
                  alt={selectedAlumni.name}
                  className="alumni-detail-img w-16 h-16 rounded-full"
                />
                <div>
                  <h3 className="font-semibold">{selectedAlumni.name}</h3>
                  <p className="alumni-meta-info text-gray-600">
                    {selectedAlumni.branch} '{selectedAlumni.batch} | {selectedAlumni.company}
                  </p>
                </div>
              </div>
              <div className="brief-details mt-2">
                <h4 className="font-semibold">Brief Details:</h4>
                <ul className="list-disc list-inside">
                  <li><strong>Branch:</strong> {selectedAlumni.branch}</li>
                  <li><strong>Batch:</strong> {selectedAlumni.batch}</li>
                  <li><strong>Current Company:</strong> {selectedAlumni.company}</li>
                  <li><strong>Position:</strong> {selectedAlumni.position}</li>
                  <li><strong>Location:</strong> {selectedAlumni.location}</li>
                </ul>
              </div>
              <a href={`/alumni-profile/${selectedAlumni.id}`} className="card-link text-blue-600 hover:underline mt-2 inline-block">
                View Full Profile <i className="fas fa-arrow-right"></i>
              </a>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
