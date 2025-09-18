import { useState } from 'react'
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'
// src/App.jsx
import { AuthProvider } from "./context/AuthContext";

export default function App({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}
