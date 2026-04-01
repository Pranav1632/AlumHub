import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { io } from "socket.io-client";
import api from "../utils/axiosInstance";
import { getErrorMessage } from "../utils/errorUtils";
import { useAuth } from "../context/AuthContext";

const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || API_BASE.replace(/\/api\/?$/, "");
const PAGE_SIZE = 40;

const normalizeId = (value) => {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") return value._id ? String(value._id) : "";
  return String(value);
};

const formatChatTime = (iso) => {
  if (!iso) return "";
  try {
    return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "";
  }
};

const createClientId = () => {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `client-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const statusLabel = (status) => {
  if (status === "read") return "Read";
  if (status === "delivered") return "Delivered";
  if (status === "failed") return "Failed";
  if (status === "sending") return "Sending...";
  return "Sent";
};

export default function ChatPage() {
  const { user } = useAuth();
  const meId = user?.id || user?._id;

  const [contacts, setContacts] = useState([]);
  const [activeContactId, setActiveContactId] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [search, setSearch] = useState("");
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [oldestCursor, setOldestCursor] = useState("");
  const [socketConnected, setSocketConnected] = useState(false);
  const [typingByContact, setTypingByContact] = useState({});
  const [error, setError] = useState("");

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const activeContactRef = useRef(activeContactId);
  const meIdRef = useRef(meId);

  useEffect(() => {
    activeContactRef.current = activeContactId;
  }, [activeContactId]);

  useEffect(() => {
    meIdRef.current = meId;
  }, [meId]);

  const activeContact = useMemo(() => {
    return contacts.find((contact) => normalizeId(contact.user?._id) === normalizeId(activeContactId)) || null;
  }, [contacts, activeContactId]);

  const filteredContacts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return contacts;
    return contacts.filter((contact) => {
      const name = contact.user?.name?.toLowerCase() || "";
      const email = contact.user?.email?.toLowerCase() || "";
      const prn = contact.user?.prn?.toLowerCase() || "";
      return name.includes(query) || email.includes(query) || prn.includes(query);
    });
  }, [contacts, search]);

  const upsertMessage = useCallback((incomingMessage) => {
    if (!incomingMessage) return;

    setMessages((prev) => {
      const incomingId = normalizeId(incomingMessage._id);
      const incomingClientId = incomingMessage.clientId || "";

      const existingIndex = prev.findIndex((msg) => {
        const msgId = normalizeId(msg._id);
        if (incomingId && msgId && incomingId === msgId) return true;
        return Boolean(incomingClientId && msg.clientId && msg.clientId === incomingClientId);
      });

      if (existingIndex >= 0) {
        const next = [...prev];
        next[existingIndex] = { ...next[existingIndex], ...incomingMessage, optimistic: false };
        return next;
      }

      return [...prev, incomingMessage].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );
    });
  }, []);

  const updateContactPreview = useCallback((contactId, text, createdAt, extra = {}) => {
    setContacts((prev) => {
      const idx = prev.findIndex((c) => normalizeId(c.user?._id) === normalizeId(contactId));
      if (idx < 0) return prev;

      const updated = [...prev];
      updated[idx] = {
        ...updated[idx],
        lastMessage: text,
        lastAt: createdAt,
        ...extra,
      };

      updated.sort((a, b) => new Date(b.lastAt || 0).getTime() - new Date(a.lastAt || 0).getTime());
      return updated;
    });
  }, []);

  const fetchContacts = useCallback(async () => {
    try {
      setLoadingContacts(true);
      const res = await api.get("/chat/contacts");
      const loaded = res.data?.contacts || [];
      setContacts(loaded);

      if (loaded.length > 0) {
        setActiveContactId((prev) => prev || normalizeId(loaded[0].user?._id));
      }
    } catch (err) {
      setError(getErrorMessage(err, "Could not load chat contacts"));
    } finally {
      setLoadingContacts(false);
    }
  }, []);

  const fetchMessages = useCallback(
    async (contactId, options = { appendHistory: false, before: "" }) => {
      if (!contactId) return;

      try {
        setLoadingMessages(true);
        const params = new URLSearchParams();
        params.set("limit", String(PAGE_SIZE));

        if (options.appendHistory && options.before) {
          params.set("before", options.before);
        }

        const res = await api.get(`/chat/${contactId}?${params.toString()}`);
        const list = res.data?.messages || [];

        setHasMore(Boolean(res.data?.hasMore));

        if (list.length > 0) {
          const nextOldest = list[0]?.createdAt || "";
          setOldestCursor(nextOldest);
        }

        if (options.appendHistory) {
          setMessages((prev) => [...list, ...prev]);
        } else {
          setMessages(list);
          if (list.length > 0) {
            const first = list[0];
            setOldestCursor(first.createdAt || "");
          } else {
            setOldestCursor("");
          }
        }
      } catch (err) {
        setError(getErrorMessage(err, "Could not load messages"));
      } finally {
        setLoadingMessages(false);
      }
    },
    []
  );

  const markConversationRead = useCallback(
    async (contactId) => {
      if (!contactId) return;

      try {
        await api.patch(`/chat/read/${contactId}`);

        setContacts((prev) =>
          prev.map((contact) =>
            normalizeId(contact.user?._id) === normalizeId(contactId)
              ? { ...contact, unreadCount: 0 }
              : contact
          )
        );

        if (socketRef.current?.connected) {
          socketRef.current.emit("chat:read", { userId: contactId });
        }
      } catch (err) {
        console.error("markConversationRead failed:", getErrorMessage(err, "mark read failed"));
      }
    },
    []
  );

  const onSend = useCallback(async () => {
    const receiverId = normalizeId(activeContactId);
    const text = input.trim();

    if (!receiverId || !text) return;
    if (text.length > 2000) {
      setError("Message is too long (max 2000 characters).");
      return;
    }

    const clientId = createClientId();
    const optimistic = {
      _id: clientId,
      clientId,
      sender: meId,
      receiver: receiverId,
      text,
      status: "sending",
      createdAt: new Date().toISOString(),
      optimistic: true,
    };

    setInput("");
    setError("");
    upsertMessage(optimistic);
    updateContactPreview(receiverId, text, optimistic.createdAt);

    try {
      if (socketRef.current?.connected) {
        socketRef.current.emit(
          "chat:send",
          {
            receiverId,
            text,
            clientId,
          },
          (response) => {
            if (!response?.ok) {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.clientId === clientId
                    ? {
                        ...msg,
                        status: "failed",
                        optimistic: false,
                      }
                    : msg
                )
              );
              setError(response?.message || "Message failed to send");
              return;
            }

            const saved = response.message;
            upsertMessage(saved);
            updateContactPreview(receiverId, saved.text, saved.createdAt);
          }
        );
      } else {
        const res = await api.post("/chat", {
          receiverId,
          text,
          clientId,
        });

        const saved = res.data;
        upsertMessage(saved);
        updateContactPreview(receiverId, saved.text, saved.createdAt);
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.clientId === clientId
            ? {
                ...msg,
                status: "failed",
                optimistic: false,
              }
            : msg
        )
      );
      setError(getErrorMessage(err, "Message failed to send"));
    }
  }, [activeContactId, input, meId, updateContactPreview, upsertMessage]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  useEffect(() => {
    if (!activeContactId) return;

    let cancelled = false;

    const loadConversation = async () => {
      await fetchMessages(activeContactId, { appendHistory: false });
      if (!cancelled) {
        markConversationRead(activeContactId);
      }
    };

    loadConversation();

    return () => {
      cancelled = true;
    };
  }, [activeContactId, fetchMessages, markConversationRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const token = user?.token;
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token },
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionAttempts: 8,
      reconnectionDelay: 500,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketConnected(true);
      setError("");
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
    });

    socket.on("chat:new", (message) => {
      try {
        const senderId = normalizeId(message.sender);
        const receiverId = normalizeId(message.receiver);
        const currentActiveId = normalizeId(activeContactRef.current);
        const currentMeId = normalizeId(meIdRef.current);

        if (senderId === currentActiveId || receiverId === currentActiveId) {
          upsertMessage(message);
        }

        const previewContactId = senderId === currentMeId ? receiverId : senderId;
        setContacts((prev) => {
          const idx = prev.findIndex((c) => normalizeId(c.user?._id) === previewContactId);
          if (idx < 0) return prev;

          const next = [...prev];
          const current = next[idx];
          const isInbound = receiverId === currentMeId;
          const isOpenConversation = senderId === currentActiveId;

          next[idx] = {
            ...current,
            lastMessage: message.text,
            lastAt: message.createdAt,
            unreadCount:
              isInbound && !isOpenConversation
                ? (current.unreadCount || 0) + 1
                : current.unreadCount || 0,
          };

          next.sort((a, b) => new Date(b.lastAt || 0).getTime() - new Date(a.lastAt || 0).getTime());
          return next;
        });

        if (senderId === currentActiveId && receiverId === currentMeId) {
          markConversationRead(currentActiveId);
        }

        fetchContacts();
      } catch (err) {
        console.error("chat:new handler error", err);
      }
    });

    socket.on("chat:sent", (message) => {
      try {
        upsertMessage(message);
      } catch (err) {
        console.error("chat:sent handler error", err);
      }
    });

    socket.on("chat:typing", ({ fromUserId, isTyping }) => {
      setTypingByContact((prev) => ({
        ...prev,
        [fromUserId]: Boolean(isTyping),
      }));
    });

    socket.on("chat:read", ({ readerId }) => {
      setMessages((prev) =>
        prev.map((msg) => {
          const senderId = normalizeId(msg.sender);
          if (
            senderId === normalizeId(meIdRef.current) &&
            normalizeId(readerId) === normalizeId(activeContactRef.current)
          ) {
            return { ...msg, status: "read" };
          }
          return msg;
        })
      );
    });

    socket.on("chat:delivered", ({ messageIds, receiverId }) => {
      setMessages((prev) =>
        prev.map((msg) => {
          const msgId = normalizeId(msg._id);
          const isTargetMessage = Array.isArray(messageIds) && messageIds.includes(msgId);
          const isTargetReceiver = normalizeId(msg.receiver) === normalizeId(receiverId);

          if (isTargetMessage || (isTargetReceiver && msg.status === "sent")) {
            return { ...msg, status: "delivered" };
          }
          return msg;
        })
      );
    });

    socket.on("presence:update", ({ userId: onlineUserId, isOnline }) => {
      setContacts((prev) =>
        prev.map((contact) =>
          normalizeId(contact.user?._id) === normalizeId(onlineUserId)
            ? { ...contact, isOnline: Boolean(isOnline) }
            : contact
        )
      );
    });

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [
    fetchContacts,
    markConversationRead,
    upsertMessage,
    user?.token,
  ]);

  const onTypingChange = (value) => {
    setInput(value);

    if (!socketRef.current?.connected || !activeContactId) return;

    socketRef.current.emit("chat:typing", {
      receiverId: activeContactId,
      isTyping: true,
    });

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit("chat:typing", {
        receiverId: activeContactId,
        isTyping: false,
      });
    }, 1200);
  };

  return (
    <div className="max-w-7xl mx-auto h-[calc(100vh-180px)] min-h-[580px] rounded-2xl border bg-white shadow overflow-hidden grid grid-cols-1 md:grid-cols-[330px,1fr]">
      <aside className="border-r bg-slate-50 flex flex-col">
        <div className="p-4 border-b bg-white">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-slate-800">Messages</h2>
            <span className={`text-xs font-medium ${socketConnected ? "text-emerald-600" : "text-amber-600"}`}>
              {socketConnected ? "Live" : "Reconnecting"}
            </span>
          </div>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name / email / PRN"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingContacts && <p className="text-xs text-slate-500 p-2">Loading conversations...</p>}
          {!loadingContacts && filteredContacts.length === 0 && (
            <p className="text-sm text-slate-500 p-2">No conversations found.</p>
          )}

          {filteredContacts.map((contact) => {
            const cid = normalizeId(contact.user?._id);
            const isActive = normalizeId(activeContactId) === cid;
            const initials = (contact.user?.name || "?")
              .split(" ")
              .map((part) => part[0])
              .join("")
              .slice(0, 2)
              .toUpperCase();

            return (
              <button
                key={cid}
                type="button"
                onClick={() => setActiveContactId(cid)}
                className={`w-full text-left rounded-xl p-3 border transition ${
                  isActive
                    ? "bg-blue-50 border-blue-300"
                    : "bg-white border-transparent hover:border-slate-200"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div className="h-10 w-10 rounded-full bg-blue-600 text-white text-sm font-semibold flex items-center justify-center">
                      {initials}
                    </div>
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full border-2 border-white ${
                        contact.isOnline ? "bg-emerald-500" : "bg-slate-300"
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center gap-2">
                      <p className="font-medium text-slate-800 truncate">{contact.user?.name || "Unknown"}</p>
                      <p className="text-[11px] text-slate-500 whitespace-nowrap">{formatChatTime(contact.lastAt)}</p>
                    </div>
                    <p className="text-xs text-slate-500 truncate mt-0.5">{contact.lastMessage || "No messages yet"}</p>
                  </div>

                  {contact.unreadCount > 0 && (
                    <span className="inline-flex min-w-5 px-1.5 h-5 rounded-full bg-blue-600 text-white text-[11px] items-center justify-center">
                      {contact.unreadCount > 99 ? "99+" : contact.unreadCount}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      <main className="flex flex-col bg-white">
        {!activeContact && (
          <div className="h-full flex items-center justify-center text-slate-500">
            Select a conversation to start chatting.
          </div>
        )}

        {activeContact && (
          <>
            <header className="border-b p-4 flex items-center justify-between bg-white">
              <div>
                <h3 className="font-semibold text-slate-900">{activeContact.user?.name}</h3>
                <p className="text-xs text-slate-500">
                  {typingByContact[normalizeId(activeContact.user?._id)]
                    ? "Typing..."
                    : activeContact.isOnline
                      ? "Online"
                      : "Offline"}
                </p>
              </div>
              <div className="text-xs text-slate-500">{activeContact.user?.email}</div>
            </header>

            <div className="flex-1 overflow-y-auto px-4 py-3 bg-gradient-to-b from-slate-50 to-white">
              {hasMore && (
                <div className="flex justify-center mb-3">
                  <button
                    type="button"
                    onClick={() =>
                      fetchMessages(activeContactId, { appendHistory: true, before: oldestCursor })
                    }
                    className="text-xs border border-slate-300 rounded-full px-3 py-1 hover:bg-slate-100"
                    disabled={loadingMessages}
                  >
                    {loadingMessages ? "Loading..." : "Load older messages"}
                  </button>
                </div>
              )}

              <div className="space-y-2">
                {messages.map((msg) => {
                  const mine = normalizeId(msg.sender) === normalizeId(meId);
                  return (
                    <div key={normalizeId(msg._id) || msg.clientId} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[75%] rounded-2xl px-3 py-2 shadow-sm ${
                          mine
                            ? "bg-blue-600 text-white rounded-br-sm"
                            : "bg-white border border-slate-200 text-slate-800 rounded-bl-sm"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap break-words">{msg.text}</p>
                        <div className="mt-1 flex items-center gap-2 justify-end">
                          <span className={`text-[10px] ${mine ? "text-blue-100" : "text-slate-500"}`}>
                            {formatChatTime(msg.createdAt)}
                          </span>
                          {mine && (
                            <span className="text-[10px] text-blue-100">{statusLabel(msg.status)}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div ref={messagesEndRef} />
            </div>

            <footer className="border-t p-3 bg-white">
              <div className="flex items-end gap-2">
                <textarea
                  rows={2}
                  value={input}
                  onChange={(e) => onTypingChange(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      onSend();
                    }
                  }}
                  placeholder="Type a message..."
                  className="flex-1 resize-none rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={onSend}
                  className="h-10 px-4 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:bg-blue-300"
                  disabled={!input.trim()}
                >
                  Send
                </button>
              </div>
            </footer>
          </>
        )}

        {error && (
          <div className="border-t border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">{error}</div>
        )}
      </main>
    </div>
  );
}
