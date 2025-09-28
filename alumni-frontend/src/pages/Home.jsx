import React from "react";
import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div className="home">
      <h1>Welcome to AlumHub</h1>
      <p>A simple Alumni Management System</p>
      <div>
        <Link to="/signup"><button>Signup</button></Link>
        <Link to="/login"><button>Login</button></Link>
      </div>
    </div>
  );
}
