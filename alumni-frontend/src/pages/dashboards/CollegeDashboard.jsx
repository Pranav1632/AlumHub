import React from "react";
import CommunityChat from "../../components/CommunityChat";
export default function CollegeDashboard() {
  return (
    <div>
      <h2>College Admin Dashboard</h2>
      <p>Here you will see pending verification requests.</p>
      <div>
        <h3>Pending Students</h3>
        {/* later: fetch from API */}
        <ul>
          <li>Student A <button>Verify</button></li>
        </ul>

        <h3>Pending Alumni</h3>
        <ul>
          <li>Alumni B <button>Verify</button></li>
        </ul>
          <CommunityChat />
      </div>
    </div>
  );
}
