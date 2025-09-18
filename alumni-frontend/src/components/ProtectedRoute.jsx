// src/components/ProtectedRoute.jsx
import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ allowedRoles }) {
  const { user, token } = useAuth();

  // If not logged in → redirect to login
  if (!token) {
    return <Navigate to="/login" replace />;
  }

  // If role check needed
  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />; // or show "Not Authorized" page
  }

  return <Outlet />; // render child routes
}
