import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function CollegeDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div>
      <h1>College Dashboard</h1>

      {/* Profile Info */}
      <section>
        <h2>Profile Info</h2>
        <p>Name: {user?.name}</p>
        <p>Role: {user?.role}</p>
        <p>Email: {user?.email}</p>
        <p>Institute Code: {user?.instituteCode}</p>
      </section>

      {/* Pending Verifications */}
      <section>
        <h2>Pending Verifications</h2>
        <p>[List of students/alumni awaiting approval will show here]</p>
      </section>

      {/* Manage Alumni / Students */}
      <section>
        <h2>Manage Users</h2>
        <button onClick={() => navigate("/manage-users")}>Go to Management Page</button>
      </section>

      {/* Reports */}
      <section>
        <h2>Reports & Analytics</h2>
        <p>[Some stats/graphs will appear here]</p>
      </section>

      {/* Logout */}
      <section>
        <button onClick={handleLogout}>Logout</button>
      </section>
    </div>
  );
}
