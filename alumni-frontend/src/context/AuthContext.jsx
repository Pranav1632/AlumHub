/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

const normalizeRole = (role) => (role === "collegeAdmin" ? "admin" : role);

const decodeJwtPayload = (token) => {
  try {
    const parts = String(token || "").split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const json = atob(padded);
    return JSON.parse(json);
  } catch {
    return null;
  }
};

const isTokenActive = (token) => {
  const normalized = String(token || "").trim();
  if (!normalized || normalized === "null" || normalized === "undefined") return false;

  const payload = decodeJwtPayload(normalized);
  if (!payload) return false;

  if (typeof payload.exp !== "number") return true;
  return payload.exp * 1000 > Date.now();
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  const clearAuth = useCallback(() => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("token");
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    const savedToken = localStorage.getItem("token");

    if (!savedUser || !savedToken || !isTokenActive(savedToken)) {
      clearAuth();
      return;
    }

    try {
      const parsed = JSON.parse(savedUser);
      const normalized = { ...parsed, token: savedToken, role: normalizeRole(parsed.role) };
      setUser(normalized);
      localStorage.setItem("user", JSON.stringify(normalized));
    } catch {
      clearAuth();
    }
  }, [clearAuth]);

  useEffect(() => {
    const handleUnauthorized = () => {
      clearAuth();
    };

    window.addEventListener("auth:unauthorized", handleUnauthorized);
    return () => window.removeEventListener("auth:unauthorized", handleUnauthorized);
  }, [clearAuth]);

  const login = useCallback((userData) => {
    const normalized = { ...userData, role: normalizeRole(userData.role) };
    if (!isTokenActive(normalized.token)) {
      clearAuth();
      return;
    }
    setUser(normalized);
    localStorage.setItem("user", JSON.stringify(normalized));
    if (normalized.token) {
      localStorage.setItem("token", normalized.token);
    }
  }, [clearAuth]);

  const logout = useCallback(() => {
    clearAuth();
  }, [clearAuth]);

  const value = useMemo(
    () => ({
      user,
      login,
      logout,
      isAuthenticated: Boolean(user?.token),
      role: user?.role || null,
    }),
    [login, logout, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
