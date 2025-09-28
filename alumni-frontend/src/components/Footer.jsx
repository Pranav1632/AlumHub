import React from "react";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <p>© {new Date().getFullYear()} AlumHub. All rights reserved.</p>
    </footer>
  );
}
