import React from "react";
import { Link } from "react-router-dom";
import backgroundImage from './image/backgroundalum.jpg'; // adjust path if needed
export default function Home() {
  return (
    <div
      className="min-h-screen bg-cover bg-center flex items-center justify-center animate-fade-in"
      style={{
        backgroundImage: `url(${backgroundImage})`,
 // ✅ Replace with your actual image path
      }}
    >
      <div className="bg-white bg-opacity-80 p-8 rounded-xl shadow-xl text-center max-w-md">
        <h1 className="text-4xl font-bold text-blue-700 mb-4">Welcome to AlumHub </h1>
        <p className="text-gray-700 mb-6">A simple Alumni Management System (Demo App)</p>
        <div className="flex justify-center gap-4">
          
        </div>
      </div>
    </div>
  );
}