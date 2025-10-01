import React, { useState } from "react";

export default function ProfilePage() {
  const [profile, setProfile] = useState({
    name: "Pranav Gaikwad",
    tagline: "Computer Science Student at AISSMS IOIT",
    location: "City, Country",
    contact: "Contact Info",
    phone: "7499167820",
    rollNumber: "S2023001",
    branch: "Computer Engineering",
    majors: "Software Development, AI",
    enrollmentYear: "2024",
    currentYear: "2st Year",
    gpa: "9.3/10.0",
    courses: [
      "Data Structures and Algorithms",
      "Introduction to Web Development",
      "Calculus I",
      "Object-Oriented Programming"
    ],
    internships: [
      {
        title: "Software Engineering Intern",
        org: "Innovate Solutions",
        duration: "Summer 2024 · 3 months",
        location: "Remote",
        logo: "internship-logo-1.png"
      },
      {
        title: "Data Analytics Intern",
        org: "Data Insights Co.",
        duration: "Winter 2023 · 2 months",
        location: "City, Country",
        logo: "internship-logo-2.png"
      }
    ],
    skills: ["Python", "JavaScript", "SQL", "HTML/CSS", "Machine Learning Basics"],
    clubs: [
      "University Robotics Club - Member",
      "Code & Coffee Society - Treasurer",
      "Student Volunteer Network"
    ]
  });

  const handleChange = (key, value) => {
    setProfile({ ...profile, [key]: value });
  };

  const saveProfile = () => {
    console.log("Profile saved:", profile);
    alert("Profile updated (dummy)");
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Intro Card */}
      <section className="flex flex-col md:flex-row items-center bg-green-50 border border-green-200 rounded-lg p-6 mb-6 shadow">
        <img
          src="student-profile-pic.jpg"
          alt=" ProfilePic"
          className="w-32 h-32 rounded-full border-4 border-green-500 mb-4 md:mb-0 md:mr-6"
        />
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-green-500 mb-1">
            <input
              type="text"
              value={profile.name}
              onChange={(e) => handleChange("name", e.target.value)}
              className="bg-transparent focus:outline-none font-bold text-green-500 text-2xl"
            />
          </h1>
          <p className="font-semibold mb-1">
            <input
              type="text"
              value={profile.tagline}
              onChange={(e) => handleChange("tagline", e.target.value)}
              className="bg-transparent focus:outline-none font-semibold"
            />
          </p>
          <p className="text-gray-600">
            <i className="fas fa-map-marker-alt mr-1 text-green-500"></i>
            {profile.location} · <a href="#" className="text-green-700">{profile.contact}</a>
          </p>
        </div>
        <div className="flex mt-4 md:mt-0 md:flex-col md:ml-6 gap-2">
          <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">
            Message
          </button>
          <button className="border border-green-500 text-green-500 hover:bg-green-100 px-4 py-2 rounded">
            Edit Profile
          </button>
        </div>
      </section>

      {/* Academic Details */}
      <section className="bg-white border rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-700">Academic Details</h2>
          <i className="fas fa-edit text-green-500 cursor-pointer"></i>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { label: "Phone", key: "phone" },
            { label: "Roll Number", key: "rollNumber" },
            { label: "Branch", key: "branch" },
            { label: "Majors", key: "majors" },
            { label: "Enrollment Year", key: "enrollmentYear" },
            { label: "Current Year", key: "currentYear" },
            { label: "GPA", key: "gpa" }
          ].map((field) => (
            <div key={field.key} className="flex flex-col">
              <label className="text-gray-600">{field.label}</label>
              <input
                type="text"
                value={profile[field.key]}
                onChange={(e) => handleChange(field.key, e.target.value)}
                className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-green-200"
              />
            </div>
          ))}
        </div>
      </section>

      {/* Courses */}
      <section className="bg-green-50 border border-green-200 rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-green-700">Courses Taken</h2>
          <div className="flex gap-2">
            <i className="fas fa-plus cursor-pointer text-green-500"></i>
            <i className="fas fa-edit cursor-pointer text-green-500"></i>
          </div>
        </div>
        <ul className="list-none space-y-2">
          {profile.courses.map((course, index) => (
            <li key={index} className="flex items-center bg-green-100 border border-green-200 text-green-700 rounded px-3 py-2">
              <i className="fas fa-book-open mr-2 text-green-500"></i>
              <input
                type="text"
                value={course}
                onChange={(e) => {
                  const newCourses = [...profile.courses];
                  newCourses[index] = e.target.value;
                  setProfile({ ...profile, courses: newCourses });
                }}
                className="bg-transparent w-full focus:outline-none"
              />
            </li>
          ))}
        </ul>
        <button className="mt-2 text-green-700 font-semibold hover:underline flex items-center gap-1">
          Add New Course <i className="fas fa-plus-circle"></i>
        </button>
      </section>

      {/* Skills */}
      <section className="bg-green-50 border border-green-200 rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-green-700">Skills</h2>
          <div className="flex gap-2">
            <i className="fas fa-plus cursor-pointer text-green-500"></i>
            <i className="fas fa-edit cursor-pointer text-green-500"></i>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          {profile.skills.map((skill, index) => (
            <span
              key={index}
              className="bg-green-100 border border-green-200 text-green-700 px-3 py-1 rounded cursor-text hover:bg-green-500 hover:text-white"
            >
              {skill}
            </span>
          ))}
        </div>
        <button className="mt-2 text-green-700 font-semibold hover:underline flex items-center gap-1">
          Add/Manage Skills <i className="fas fa-arrow-right"></i>
        </button>
      </section>

      {/* Clubs */}
      <section className="bg-green-50 border border-green-200 rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-green-700">Clubs & Societies</h2>
          <div className="flex gap-2">
            <i className="fas fa-plus cursor-pointer text-green-500"></i>
            <i className="fas fa-edit cursor-pointer text-green-500"></i>
          </div>
        </div>
        <ul className="list-none space-y-2">
          {profile.clubs.map((club, index) => (
            <li key={index} className="flex items-center bg-green-100 border border-green-200 text-green-700 rounded px-3 py-2">
              <i className="fas fa-users mr-2 text-green-500"></i>
              <input
                type="text"
                value={club}
                onChange={(e) => {
                  const newClubs = [...profile.clubs];
                  newClubs[index] = e.target.value;
                  setProfile({ ...profile, clubs: newClubs });
                }}
                className="bg-transparent w-full focus:outline-none"
              />
            </li>
          ))}
        </ul>
        <button className="mt-2 text-green-700 font-semibold hover:underline flex items-center gap-1">
          Add New Club/Society <i className="fas fa-plus-circle"></i>
        </button>
      </section>

      {/* Save Button */}
      <div className="flex justify-end">
        <button
          onClick={saveProfile}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded shadow"
        >
          Save Profile
        </button>
      </div>
    </div>
  );
}
