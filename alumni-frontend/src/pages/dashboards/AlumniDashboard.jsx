import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function AlumniDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div>
      <h1>Alumni Dashboard</h1>

      {/* Profile Info */}
      <section>
        <h2>Profile Info</h2>
        <p>Name: {user?.name}</p>
        <p>Role: {user?.role}</p>
        <p>Email: {user?.email}</p>
        <p>PRN: {user?.prn}</p>
        <p>Verified: {user?.verified ? "Yes" : "No"}</p>
      </section>

      {/* Discussion / News Feed */}
      <section>
        <h2>Discussion Feed</h2>
        <p>[List of discussion posts will appear here]</p>
      </section>

      {/* Chat Shortcut */}
      <section>
        <h2>Chat</h2>
        <button onClick={() => navigate("/chat")}>Go to Chat</button>
      </section>

      {/* Alumni Directory / Mentorship */}
      <section>
        <h2>Alumni Directory</h2>
        <button onClick={() => navigate("/alumni-directory")}>View Directory</button>

        <h2>Mentorship Requests</h2>
        <button onClick={() => navigate("/mentorship")}>View Requests</button>
      </section>

      {/* Logout */}
      <section>
        <button onClick={handleLogout}>Logout</button>
      </section>
    </div>
  );
}
