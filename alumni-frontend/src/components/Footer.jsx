import React from 'react';
import { Link, NavLink } from 'react-router-dom';
import logo from '../assets/logo.png'; // Replace with your actual logo path

export default function Footer() {
  return (
    <footer className="bg-white border-t shadow-sm mt-12">
      <div className="max-w-screen-xl mx-auto px-4 py-6 lg:py-8">
        <div className="md:flex md:justify-between md:items-start">
          {/* Logo Section */}
          <div className="mb-6 md:mb-0">
            <Link to="/" className="flex items-center">
              <img
                src={logo}
                alt="AlumHub Logo"
                className="h-8 w-8 rounded-full object-cover"
              />
              <span className="ml-2 text-xl font-bold text-blue-700">AlumHub</span>
            </Link>
          </div>

          {/* Link Groups */}
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3 text-sm">
            <div>
              <h2 className="mb-4 font-semibold text-gray-900 uppercase">Resources</h2>
              <ul className="space-y-2 text-gray-600">
                <li><NavLink to="/" className="hover:text-blue-600">Home</NavLink></li>
                <li><NavLink to="/about" className="hover:text-blue-600">About Us</NavLink></li>
                <li><NavLink to="/feedback" className="hover:text-blue-600">Feedback</NavLink></li>
              </ul>
            </div>
            <div>
              <h2 className="mb-4 font-semibold text-gray-900 uppercase">Follow Us</h2>
              <ul className="space-y-2 text-gray-600">
                <li><a href="https://github.com/hiteshchoudhary" target="_blank" rel="noreferrer" className="hover:text-blue-600">GitHub</a></li>
                <li><a href="https://discord.com" target="_blank" rel="noreferrer" className="hover:text-blue-600">Discord</a></li>
              </ul>
            </div>
            <div>
              <h2 className="mb-4 font-semibold text-gray-900 uppercase">Legal</h2>
              <ul className="space-y-2 text-gray-600">
                <li><NavLink to="/privacy" className="hover:text-blue-600">Privacy Policy</NavLink></li>
                <li><NavLink to="/terms" className="hover:text-blue-600">Terms & Conditions</NavLink></li>
              </ul>
            </div>
          </div>
        </div>

        {/* Divider */}
        <hr className="my-6 border-gray-200" />

        {/* Bottom Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-500">
          <span>
            © 2023 <a href="https://google.com/" className="hover:underline">Google</a>. All rights reserved.
          </span>

          {/* Social Icons */}
          <div className="flex mt-4 space-x-5 sm:mt-0">
            {[
              { label: "Facebook", href: "#", icon: "facebook" },
              { label: "Discord", href: "#", icon: "discord" },
              { label: "Twitter", href: "#", icon: "twitter" },
              { label: "GitHub", href: "#", icon: "github" },
              { label: "Dribbble", href: "#", icon: "dribbble" },
            ].map((social, idx) => (
              <a key={idx} href={social.href} className="text-gray-500 hover:text-gray-900" aria-label={social.label}>
                <span className="sr-only">{social.label}</span>
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <circle cx="10" cy="10" r="10" />
                </svg>
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}