import React, { useState } from "react";

export default function MentorshipRequestsPage() {
  const [requests, setRequests] = useState([
    { id: 1, from: "Student A", status: "pending" },
  ]);

  const accept = (id) => {
    setRequests(
      requests.map((r) =>
        r.id === id ? { ...r, status: "accepted" } : r
      )
    );
  };

  const reject = (id) => {
    setRequests(
      requests.map((r) =>
        r.id === id ? { ...r, status: "rejected" } : r
      )
    );
  };

  return (
    <div>
      <h2>Mentorship Requests</h2>
      {requests.map((r) => (
        <div key={r.id}>
          {r.from} - Status: {r.status}
          {r.status === "pending" && (
            <>
              <button onClick={() => accept(r.id)}>Accept</button>
              <button onClick={() => reject(r.id)}>Reject</button>
            </>
          )}
        </div>
      ))}
    </div>
  );
}
