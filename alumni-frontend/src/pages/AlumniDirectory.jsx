// src/pages/AlumniDirectory.jsx
import React, { useState } from "react";
import "./css-pages/alumni-page.css";

const alumniList = [
  {
    id: 1,
    name: "Shreyash Shinde",
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
    name: "Shreya Gaikwad",
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
    name: "Vinay Gole",
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
  {
    id: 8,
    name: "Sneha Patil",
    position: "Software Engineer",
    company: "Google",
    location: "Pune, India",
    branch: "Computer Engineering",
    batch: 2016,
    working: "Yes",
    type: "Full-time",
    img: "https://avatar.iran.liara.run/public/20",
    phone: "+91 98765 43210",
    roll: "CE2016SP",
    linkedin: "https://linkedin.com/in/sneha-patil",
    willingToMentor: true,
    experience: [
      {
        title: "Software Engineer",
        company: "Google",
        duration: "Feb 2021 – Present · 4 yrs",
        location: "Pune, India",
        type: "Full-time",
        logo: "/google-logo.png",
      },
      {
        title: "Frontend Developer",
        company: "Persistent Systems",
        duration: "Jul 2018 – Jan 2021 · 2 yrs 6 mos",
        location: "Nagpur, India",
        type: "Full-time",
        logo: "/persistent-logo.png",
      },
    ],
    achievements: [
      "Built internal dashboard used by 300+ employees",
      "Won Google Hackathon India 2022",
      "Mentored 5 interns through Google Summer of Code",
    ],
  },
  {
    id: 9,
    name: "Rohan Jadhav",
    position: "Design Engineer",
    company: "Tata Motors",
    location: "Mumbai, India",
    branch: "Mechanical",
    batch: 2014,
    working: "Yes",
    type: "Full-time",
    img: "https://avatar.iran.liara.run/public/21",
    phone: "+91 99887 66554",
    roll: "ME2014RJ",
    linkedin: "https://linkedin.com/in/rohan-jadhav",
    willingToMentor: false,
    experience: [
      {
        title: "Design Engineer",
        company: "Tata Motors",
        duration: "Jan 2016 – Present · 9 yrs",
        location: "Mumbai, India",
        type: "Full-time",
        logo: "/tatamotors-logo.png",
      },
    ],
    achievements: [
      "Patented a new suspension design",
      "Presented at Auto Expo 2023",
    ],
  },
  {
    id: 10,
    name: "Aarti Kulkarni",
    position: "System Analyst",
    company: "Infosys",
    location: "Pune, India",
    branch: "IT",
    batch: 2017,
    working: "Yes",
    type: "Full-time",
    img: "https://avatar.iran.liara.run/public/22",
    phone: "+91 91234 56789",
    roll: "IT2017AK",
    linkedin: "https://linkedin.com/in/aarti-kulkarni",
    willingToMentor: true,
    experience: [
      {
        title: "System Analyst",
        company: "Infosys",
        duration: "Mar 2020 – Present · 5 yrs",
        location: "Pune, India",
        type: "Full-time",
        logo: "/infosys-logo.png",
      },
    ],
    achievements: [
      "Automated client reporting system",
      "Recognized as Top Performer 2021",
    ],
  },
  {
    id: 11,
    name: "Siddharth More",
    position: "Independent Consultant",
    company: "",
    location: "Nashik, India",
    branch: "Civil",
    batch: 2013,
    working: "No",
    type: "Freelance",
    img: "https://avatar.iran.liara.run/public/23",
    phone: "+91 90000 12345",
    roll: "CV2013SM",
    linkedin: "https://linkedin.com/in/siddharth-more",
    willingToMentor: true,
    experience: [],
    achievements: [
      "Consulted on 12+ residential projects",
      "Guest lecturer at Nashik Polytechnic",
    ],
  },
  {
    id: 12,
    name: "Neha Shinde",
    position: "Embedded Systems Engineer",
    company: "Samsung R&D",
    location: "Noida, India",
    branch: "Electronics & Telecommunication",
    batch: 2018,
    working: "Yes",
    type: "Full-time",
    img: "https://avatar.iran.liara.run/public/24",
    phone: "+91 98765 11122",
    roll: "ET2018NS",
    linkedin: "https://linkedin.com/in/neha-shinde",
    willingToMentor: true,
    experience: [
      {
        title: "Embedded Systems Engineer",
        company: "Samsung R&D",
        duration: "Aug 2019 – Present · 6 yrs",
        location: "Noida, India",
        type: "Full-time",
        logo: "/samsung-logo.png",
      },
    ],
    achievements: [
      "Optimized firmware for IoT devices",
      "Presented at IEEE Embedded Conference",
    ],
  },
  {
    id: 13,
    name: "Omkar Pawar",
    position: "Power Systems Analyst",
    company: "Siemens",
    location: "Mumbai, India",
    branch: "Electrical",
    batch: 2015,
    working: "Yes",
    type: "Full-time",
    img: "https://avatar.iran.liara.run/public/25",
    phone: "+91 88888 44444",
    roll: "EE2015OP",
    linkedin: "https://linkedin.com/in/omkar-pawar",
    willingToMentor: false,
    experience: [
      {
        title: "Power Systems Analyst",
        company: "Siemens",
        duration: "May 2016 – Present · 9 yrs",
        location: "Mumbai, India",
        type: "Full-time",
        logo: "/siemens-logo.png",
      },
    ],
    achievements: [
      "Designed grid optimization model",
      "Published paper in IEEE Transactions",
    ],
  },
  {
    id: 14,
    name: "Pooja Joshi",
    position: "Cloud Solutions Architect",
    company: "Amazon",
    location: "Hyderabad, India",
    branch: "Computer Science",
    batch: 2016,
    working: "Yes",
    type: "Full-time",
    img: "https://avatar.iran.liara.run/public/26",
    phone: "+91 77777 33333",
    roll: "CS2016PJ",
    linkedin: "https://linkedin.com/in/pooja-joshi",
    willingToMentor: true,
    experience: [
      {
        title: "Cloud Solutions Architect",
        company: "Amazon",
        duration: "Jan 2020 – Present · 5 yrs",
        location: "Hyderabad, India",
        type: "Full-time",
        logo: "/amazon-logo.png",
      },
    ],
    achievements: [
      "Migrated 50+ clients to AWS",
      "Certified AWS Professional Architect",
    ],
  },
  {
    id: 15,
    name: "Aditya Gokhale",
    position: "Automation Specialist",
    company: "ABB",
    location: "Pune, India",
    branch: "Instrumentation",
    batch: 2012,
    working: "Yes",
    type: "Full-time",
    img: "https://avatar.iran.liara.run/public/27",
    phone: "+91 90909 22222",
    roll: "IN2012AG",
    linkedin: "https://linkedin.com/in/aditya-gokhale",
    willingToMentor: false,
    experience: [
      {
        title: "Automation Specialist",
        company: "ABB",
        duration: "Apr 2013 – Present · 12 yrs",
        location: "Pune, India",
        type: "Full-time",
        logo: "/abb-logo.png",
      },
    ],
    achievements: [
      "Implemented SCADA systems across 3 plants",
      "Trained 100+ engineers in PLC programming",
    ],
  }

  

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
            
            <a href="#" className="nav-link active">Alumni</a>
            <a href="/chat" className="nav-link">Messaging</a>
          </nav>
        </div>
        <div className="navbar-right">
          <div className="search-container">
            <input
              type="text"
              placeholder="Search Alumni......"
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
