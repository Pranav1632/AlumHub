import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "./layout/MainLayout";


/// 
import App from "./App";
import ProtectedRoute from "./components/ProtectedRoute";
// Pages
import Home from "./pages/Home";  
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import StudentDashboard from "./pages/dashboards/StudentDashboard";
import AlumniDashboard from "./pages/dashboards/AlumniDashboard";
import CollegeDashboard from "./pages/dashboards/CollegeDashboard";
import ChatPage from "./pages/Chatpage";
import DiscussionPage from "./pages/DiscussionPage";
import ProfilePage from "./pages/ProfilePage";
import AlumniDirectory from "./pages/AlumniDirectory";
import MentorshipRequestsPage from "./pages/MentorshipRequestsPage";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
  <Route path="/" element={<MainLayout />}>
    {/* Public Routes */}
    <Route index element={<Home />} />
    <Route path="signup" element={<Signup />} />
    <Route path="login" element={<Login />} />

    {/* 🔒 Protected Routes */}
    <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
      <Route path="dashboard/student" element={<StudentDashboard />} />
    </Route>

    <Route element={<ProtectedRoute allowedRoles={["alumni"]} />}>
      <Route path="dashboard/alumni" element={<AlumniDashboard />} />
    </Route>

    <Route element={<ProtectedRoute allowedRoles={["collegeAdmin"]} />}>
      <Route path="dashboard/college" element={<CollegeDashboard />} />
    </Route>

    {/* General protected routes (any logged-in user) */}
    <Route element={<ProtectedRoute />}>
      <Route path="chat" element={<ChatPage />} />
      <Route path="discussion" element={<DiscussionPage />} />
      <Route path="profile" element={<ProfilePage />} />
      <Route path="alumni-directory" element={<AlumniDirectory />} />
      <Route path="mentorship" element={<MentorshipRequestsPage />} />
    </Route>
  </Route>
  </Routes>;

    </BrowserRouter>
  </React.StrictMode>
);
