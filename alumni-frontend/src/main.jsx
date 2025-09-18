import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import App from "./App"; // ✅ AuthProvider wrapper
import MainLayout from "./layout/MainLayout";
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
    <App> {/* ✅ App includes AuthProvider */}
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<MainLayout />}>
            {/* Public Routes */}
            <Route index element={<Home />} />
            <Route path="signup" element={<Signup />} />
            <Route path="login" element={<Login />} />

            {/* Student Dashboard */}
            <Route element={<ProtectedRoute allowedRoles={["student"]} />}>
              <Route path="dashboard/student" element={<StudentDashboard />} />
            </Route>

            {/* Alumni Dashboard */}
            <Route element={<ProtectedRoute allowedRoles={["alumni"]} />}>
              <Route path="dashboard/alumni" element={<AlumniDashboard />} />
            </Route>

            {/* College Admin Dashboard */}
            <Route element={<ProtectedRoute allowedRoles={["collegeAdmin"]} />}>
              <Route path="dashboard/college" element={<CollegeDashboard />} />
            </Route>

            {/* Shared protected routes */}
            <Route element={<ProtectedRoute />}>
              <Route path="chat" element={<ChatPage />} />
              <Route path="discussion" element={<DiscussionPage />} />
              <Route path="profile" element={<ProfilePage />} />
              <Route path="alumni-directory" element={<AlumniDirectory />} />
              <Route path="mentorship" element={<MentorshipRequestsPage />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </App>
  </React.StrictMode>
);
