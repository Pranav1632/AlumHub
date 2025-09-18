import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function StudentDashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div>
      <h1>Student Dashboard</h1>

      {/* Profile Info */}
      <section>
        <h2>Profile Info</h2>
        <p>Name: {user?.name}</p>
        <p>Role: {user?.role}</p>
        <p>Email: {user?.email}</p>
        <p>PRN: {user?.prn}</p>
        <p>Verified: {user?.verified ? "Yes" : "No"}</p>
      </section>

      {/* Courses / Resources */}
      <section>
        <h2>Courses & Resources</h2>
        <p>[Links to study materials / resources here]</p>
      </section>

      {/* Alumni Interaction */}
      <section>
        <h2>Alumni Interaction</h2>
        <button onClick={() => navigate("/discussion")}>Go to Discussions</button>
      </section>

      {/* Chat */}
      <section>
        <h2>Chat</h2>
        <button onClick={() => navigate("/chat")}>Go to Chat</button>
      </section>

      {/* Logout */}
      <section>
        <button onClick={handleLogout}>Logout</button>
      </section>
    </div>
  );
}
