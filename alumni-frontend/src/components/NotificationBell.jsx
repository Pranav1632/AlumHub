import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import { FiBell } from "react-icons/fi";
import api from "../utils/axiosInstance";
import { getErrorMessage } from "../utils/errorUtils";
import { useAuth } from "../context/AuthContext";

const DEFAULT_API_BASE_URL = "https://alumhub.up.railway.app/api";
const API_BASE = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_BASE.replace(/\/api\/?$/, "");

const relativeTime = (iso) => {
  if (!iso) return "";
  const date = new Date(iso).getTime();
  const diff = Date.now() - date;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const playNotificationSound = () => {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = 880;
    gain.gain.value = 0.04;
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.13);
  } catch {
    // ignore sound failures
  }
};

export default function NotificationBell() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef(null);

  const loadNotifications = useCallback(async () => {
    if (!user?.token) return;
    try {
      setLoading(true);
      const res = await api.get("/notifications?limit=25");
      setNotifications(res.data?.items || []);
      setUnreadCount(res.data?.unreadCount || 0);
      setError("");
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load notifications"));
    } finally {
      setLoading(false);
    }
  }, [user?.token]);

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((item) => (String(item._id) === String(id) ? { ...item, isRead: true } : item))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // ignore single read failure
    }
  };

  const markAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })));
      setUnreadCount(0);
    } catch {
      // ignore bulk read failure
    }
  };

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  useEffect(() => {
    if (!user?.token) return undefined;
    const socket = io(SOCKET_URL, {
      auth: { token: user.token },
      transports: ["websocket", "polling"],
      reconnection: true,
    });

    socket.on("notification:new", ({ notification }) => {
      if (!notification) return;
      setNotifications((prev) => [notification, ...prev].slice(0, 40));
      setUnreadCount((prev) => prev + 1);
      playNotificationSound();
    });

    return () => {
      socket.removeAllListeners("notification:new");
      socket.disconnect();
    };
  }, [user?.token]);

  useEffect(() => {
    const onClickOutside = (event) => {
      if (!wrapRef.current) return;
      if (!wrapRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const unreadLabel = useMemo(
    () => (unreadCount > 99 ? "99+" : String(unreadCount)),
    [unreadCount]
  );

  if (!user?.token) return null;

  return (
    <div className="relative" ref={wrapRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative inline-flex items-center justify-center h-10 w-10 rounded-lg border border-slate-300 hover:bg-slate-100"
        title="Notifications"
      >
        <FiBell size={18} className="text-slate-700" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-5 h-5 px-1 rounded-full bg-red-600 text-white text-[10px] flex items-center justify-center">
            {unreadLabel}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-[360px] max-w-[92vw] bg-white border border-slate-200 rounded-xl shadow-xl z-50">
          <div className="flex items-center justify-between p-3 border-b border-slate-200">
            <h4 className="font-semibold text-slate-800">Notifications</h4>
            <button
              onClick={markAllRead}
              className="text-xs px-2 py-1 rounded border border-slate-300 hover:bg-slate-50"
            >
              Mark all read
            </button>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading && <p className="text-sm text-slate-500 p-3">Loading...</p>}
            {!loading && notifications.length === 0 && (
              <p className="text-sm text-slate-500 p-3">No notifications yet.</p>
            )}
            {notifications.map((item) => (
              <button
                key={item._id}
                onClick={() => markRead(item._id)}
                className={`w-full text-left p-3 border-b border-slate-100 hover:bg-slate-50 ${
                  item.isRead ? "bg-white" : "bg-blue-50/40"
                }`}
              >
                <p className="text-sm font-medium text-slate-800">{item.title}</p>
                <p className="text-xs text-slate-600 mt-0.5">{item.message}</p>
                <p className="text-[11px] text-slate-400 mt-1">{relativeTime(item.createdAt)}</p>
              </button>
            ))}
          </div>

          {error && <p className="text-xs text-red-600 p-2">{error}</p>}
        </div>
      )}
    </div>
  );
}
