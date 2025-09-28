// src/pages/dashboards/AlumniDashboard.jsx
import { useEffect, useState } from "react";
import axios from "../../utils/axiosInstance";

export default function AlumniDashboard() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("Not logged in");
        return;
      }
      // try {
      //   const res = await axios.get("/users/me");
      //   setUser(res.data);
      // } catch (err) {
      //   console.error(err);
      //   setError("Failed to fetch profile. Check backend or token.");
      // }
    };
    fetchProfile();
  }, []);

  if (error) return <p>{error}</p>;
  if (!user) return <p>Loading.....</p>;

  return (
    <div>
      <h2>Alumni Dashboard</h2>
      <p>Welcome, {user.name}</p>
      <p>Your role: {user.role}</p>
      <p>Email: {user.email}</p>
      <p>PRN: {user.prn || "N/A"}</p>
      <p>Verified: {user.verified ? "Yes" : "No"}</p>
      <button onClick={() => navigate("/me")}>Update Profile</button>

    </div>
  );
}
