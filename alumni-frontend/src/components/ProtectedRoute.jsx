import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const normalizeRole = (role) => (role === "collegeAdmin" ? "admin" : role);

const homeForRole = (role) => {
  if (role === "admin") return "/admin/dashboard";
  if (role === "student") return "/student/dashboard";
  if (role === "alumni") return "/alumni/dashboard";
  return "/";
};

const ProtectedRoute = ({ children, allowRoles = [] }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user?.token) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  const role = normalizeRole(user.role);
  if (allowRoles.length > 0 && !allowRoles.includes(role)) {
    return <Navigate to={homeForRole(role)} replace />;
  }

  return children;
};

export default ProtectedRoute;