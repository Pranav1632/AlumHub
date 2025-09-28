import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

// Layout
import Header from "./components/Header";
import Footer from "./components/Footer";

// Pages
import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import StudentDashboard from "./pages/dashboards/StudentDashboard";
import AlumniDashboard from "./pages/dashboards/AlumniDashboard";
import CollegeDashboard from "./pages/dashboards/CollegeDashboard";
import DiscussionPage from "./pages/DiscussionPage";
import ChatPage from "./pages/Chatpage";
import ProtectedRoute from "./components/ProtectedRoute"; // ✅ import

import "./index.css";
// import the new page at the top
import AlumniDirectory from "./pages/AlumniDirectory";
import JobBoard from "./pages/JobBoard"; // ✅ import the JobBoard page
import CalendarPage from "./pages/CalenderPage";  // ✅ import the CalendarPage


ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Header />
        <main style={{ minHeight: "80vh", padding: "20px" }}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Home />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />

            {/* Dashboards (Protected) */}
            <Route
              path="/dashboard/student"
              element={
                <ProtectedRoute>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/alumni"
              element={
                <ProtectedRoute>
                  <AlumniDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/college"
              element={
                <ProtectedRoute>
                  <CollegeDashboard />
                </ProtectedRoute>
              }
            />

            {/* Community routes (Public for now, can protect later) */}
            <Route path="/discussion" element={<DiscussionPage />} />
            <Route path="/chat" element={<ChatPage />} />
             {/* Alumni Directory */}
  <Route path="/alumni-directory" element={<AlumniDirectory />} />
  <Route path="/job-board" element={<JobBoard />} /> 
  <Route path="/calendar" element={<CalendarPage />} />
  <Route path="/events" element={<CalendarPage />} />
  
          </Routes>
        </main>
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
