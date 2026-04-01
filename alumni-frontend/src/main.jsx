import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";

import Header from "./components/Header";
import Footer from "./components/Footer";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Signup from "./pages/Signup";
import Login from "./pages/Login";
import StudentDashboard from "./pages/dashboards/StudentDashboard";
import AlumniDashboard from "./pages/dashboards/AlumniDashboard";
import CollegeDashboard from "./pages/dashboards/CollegeDashboard";
import DiscussionPage from "./pages/DiscussionPage";
import ChatPage from "./pages/Chatpage";
import AlumniDirectory from "./pages/AlumniDirectory";
import CalendarPage from "./pages/CalenderPage";
import ProfilePage from "./pages/ProfilePage";
import Feedback from "./pages/Feedback";
import StudentVisitProfilePage from "./pages/StudentVisitProfilePage";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <Header />
        <main style={{ minHeight: "80vh", padding: "20px" }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />

            <Route
              path="/student/dashboard"
              element={
                <ProtectedRoute allowRoles={["student"]}>
                  <StudentDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/alumni/dashboard"
              element={
                <ProtectedRoute allowRoles={["alumni"]}>
                  <AlumniDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/dashboard"
              element={
                <ProtectedRoute allowRoles={["admin"]}>
                  <CollegeDashboard />
                </ProtectedRoute>
              }
            />

            <Route
              path="/discussion"
              element={
                <ProtectedRoute allowRoles={["student", "alumni", "admin"]}>
                  <DiscussionPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/chat"
              element={
                <ProtectedRoute allowRoles={["student", "alumni", "admin"]}>
                  <ChatPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/alumni-directory"
              element={
                <ProtectedRoute allowRoles={["student", "admin"]}>
                  <AlumniDirectory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/events"
              element={
                <ProtectedRoute allowRoles={["student", "alumni", "admin"]}>
                  <CalendarPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute allowRoles={["student", "alumni", "admin"]}>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile/visit/student/:id"
              element={
                <ProtectedRoute allowRoles={["student"]}>
                  <StudentVisitProfilePage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/feedback"
              element={
                <ProtectedRoute allowRoles={["student", "alumni", "admin"]}>
                  <Feedback />
                </ProtectedRoute>
              }
            />

            <Route path="/dashboard/student" element={<Navigate to="/student/dashboard" replace />} />
            <Route path="/dashboard/alumni" element={<Navigate to="/alumni/dashboard" replace />} />
            <Route path="/dashboard/college" element={<Navigate to="/admin/dashboard" replace />} />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>
);
