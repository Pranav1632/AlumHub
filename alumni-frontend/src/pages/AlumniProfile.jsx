// src/pages/AlumniProfile.jsx
import React from "react";

export default function AlumniProfile() {
  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Intro Card */}
      <section className="bg-white shadow-md rounded-xl p-6 flex flex-col md:flex-row items-center md:items-start gap-6 mb-6">
        <img
          src="/alumni-profile-pic.jpg"
          alt="Alumni Profile"
          className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-blue-600"
        />
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-blue-600">Alumni Name</h1>
          <p className="italic text-gray-700 mt-1">
            Senior Software Engineer at TechCorp
          </p>
          <p className="text-gray-500 mt-1 flex items-center gap-2">
            <i className="fas fa-map-marker-alt"></i> Location, Country ·{" "}
            <a href="#" className="text-blue-500 underline">Contact Info</a>
          </p>
          <div className="flex gap-3 mt-4">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition">
              Connect
            </button>
            <button className="bg-gray-200 text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-300 transition">
              Message
            </button>
            <button className="bg-gray-100 text-gray-600 px-4 py-2 rounded-lg hover:bg-gray-200 transition">
              Edit Profile
            </button>
          </div>
        </div>
      </section>

      {/* Personal Details */}
      <section className="bg-white shadow-md rounded-xl p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Personal Details</h2>
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label className="block text-gray-600 mb-1">Phone</label>
            <input type="tel" value="+1 123-456-7890" readOnly className="w-full border-gray-300 rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block text-gray-600 mb-1">Roll Number</label>
            <input type="text" value="12345" readOnly className="w-full border-gray-300 rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block text-gray-600 mb-1">Branch</label>
            <input type="text" value="Computer Science" readOnly className="w-full border-gray-300 rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block text-gray-600 mb-1">Graduation Year</label>
            <input type="text" value="2018" readOnly className="w-full border-gray-300 rounded-md px-3 py-2" />
          </div>
          <div>
            <label className="block text-gray-600 mb-1">LinkedIn Profile</label>
            <input type="url" value="https://www.linkedin.com/in/alumni-profile" readOnly className="w-full border-gray-300 rounded-md px-3 py-2 text-blue-600 underline" />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <input type="checkbox" checked readOnly className="w-5 h-5" />
            <span className="text-gray-700">Yes, I am willing to mentor students.</span>
          </div>
        </div>
      </section>

      {/* Professional Experience */}
      <section className="bg-white shadow-md rounded-xl p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Professional Experience</h2>

        <div className="grid gap-4">
          {/* Job 1 */}
          <div className="flex items-center gap-4 p-4 border rounded-lg">
            <img src="/techcorp-logo.png" alt="TechCorp Logo" className="w-16 h-16 rounded-lg" />
            <div>
              <h3 className="font-semibold text-gray-800">Senior Software Engineer</h3>
              <p className="text-gray-600">TechCorp</p>
              <p className="text-gray-500">Jan 2021 – Present · 2 yrs 8 mos</p>
              <p className="text-gray-500">New York, USA · Full-time</p>
            </div>
          </div>
          {/* Job 2 */}
          <div className="flex items-center gap-4 p-4 border rounded-lg">
            <img src="/dataspark-logo.png" alt="DataSpark Logo" className="w-16 h-16 rounded-lg" />
            <div>
              <h3 className="font-semibold text-gray-800">Software Developer</h3>
              <p className="text-gray-600">DataSpark Solutions</p>
              <p className="text-gray-500">Jun 2018 – Dec 2020 · 2 yrs 7 mos</p>
              <p className="text-gray-500">Boston, USA · Full-time</p>
            </div>
          </div>
        </div>

        <a href="#" className="text-blue-600 mt-4 inline-block hover:underline">Show all experience <i className="fas fa-arrow-right"></i></a>
      </section>

      {/* Achievements */}
      <section className="bg-white shadow-md rounded-xl p-6 mb-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Achievements</h2>
        <ul className="space-y-2">
          <li className="flex items-center gap-2 bg-blue-100 p-2 rounded-md text-blue-800">
            <i className="fas fa-award"></i> Led successful migration project, reducing server costs by 15%.
          </li>
          <li className="flex items-center gap-2 bg-blue-100 p-2 rounded-md text-blue-800">
            <i className="fas fa-award"></i> Mentored junior developers, improving team code quality by 20%.
          </li>
          <li className="flex items-center gap-2 bg-blue-100 p-2 rounded-md text-blue-800">
            <i className="fas fa-award"></i> Awarded 'Innovator of the Year' for contributing to a new product feature.
          </li>
        </ul>
        <a href="#" className="text-blue-600 mt-4 inline-block hover:underline">Add New Achievement <i className="fas fa-plus-circle"></i></a>
      </section>
    </div>
  );
}
