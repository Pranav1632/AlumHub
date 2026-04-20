import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import {
  FiArrowLeft,
  FiChevronDown,
  FiChevronRight,
  FiMessageSquare,
  FiRefreshCw,
  FiSend,
  FiUsers,
} from "react-icons/fi";
import api from "../utils/axiosInstance";
import { getErrorMessage } from "../utils/errorUtils";
import { useAuth } from "../context/AuthContext";

const DEFAULT_API_BASE_URL = "https://alumhub.up.railway.app/api";
const API_BASE = import.meta.env.VITE_API_BASE_URL || DEFAULT_API_BASE_URL;
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
  const navigate = useNavigate();
  const location = useLocation();
  const meId = user?.id || user?._id;
  const isStudent = user?.role === "student";
  const isAlumni = user?.role === "alumni";
  const canManageChatRequests = false;

  const [contacts, setContacts] = useState([]);
  const [activeContactId, setActiveContactId] = useState("");
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [contactSearch, setContactSearch] = useState("");
  const [messageSearch, setMessageSearch] = useState("");
  const [debouncedMessageSearch, setDebouncedMessageSearch] = useState("");
  const [chatRequests, setChatRequests] = useState([]);
  const [mobilePanel, setMobilePanel] = useState("contacts");
  const [showIncomingRequests, setShowIncomingRequests] = useState(true);
  const [showOutgoingRequests, setShowOutgoingRequests] = useState(true);
  const [loadingRequests, setLoadingRequests] = useState(false);
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

  const activeContact = useMemo(
    () => contacts.find((contact) => normalizeId(contact.user?._id) === normalizeId(activeContactId)) || null,
    [contacts, activeContactId]
  );

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedMessageSearch(messageSearch.trim());
    }, 250);
    return () => clearTimeout(timer);
  }, [messageSearch]);

  const filteredContacts = useMemo(() => {
    const query = contactSearch.trim().toLowerCase();
    if (!query) return contacts;
    return contacts
      .map((contact) => {
        const name = contact.user?.name?.toLowerCase() || "";
        const email = contact.user?.email?.toLowerCase() || "";
        const prn = contact.user?.prn?.toLowerCase() || "";
        const lastMessage = contact.lastMessage?.toLowerCase() || "";

        let score = 0;
        if (name.startsWith(query)) score += 6;
        if (name.includes(query)) score += 4;
        if (prn.startsWith(query)) score += 5;
        if (prn.includes(query)) score += 3;
        if (email.includes(query)) score += 2;
        if (lastMessage.includes(query)) score += 1;

        return { contact, score };
      })
      .filter((item) => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((item) => item.contact);
  }, [contacts, contactSearch]);

  const incomingPending = useMemo(
    () =>
      chatRequests.filter(
        (r) => r.status === "pending" && normalizeId(r.receiver?._id) === normalizeId(meId)
      ),
    [chatRequests, meId]
  );

  const outgoingPending = useMemo(
    () =>
      chatRequests.filter(
        (r) => r.status === "pending" && normalizeId(r.requester?._id) === normalizeId(meId)
      ),
    [chatRequests, meId]
  );

  const addOrActivateContact = useCallback((otherUser) => {
    if (!otherUser?._id) return;
    const otherId = normalizeId(otherUser._id);

    setContacts((prev) => {
      const exists = prev.some((c) => normalizeId(c.user?._id) === otherId);
      if (exists) return prev;
      return [
        {
          user: otherUser,
          lastMessage: "",
          lastAt: new Date(0).toISOString(),
          lastStatus: "sent",
          unreadCount: 0,
          isOnline: false,
        },
        ...prev,
      ];
    });

    setActiveContactId(otherId);
    if (window.innerWidth < 768) {
      setMobilePanel("chat");
    }
  }, []);

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

  const fetchRequests = useCallback(async () => {
    if (!canManageChatRequests) return;
    try {
      setLoadingRequests(true);
      const res = await api.get("/chat/requests?type=all");
      setChatRequests(res.data?.requests || []);
    } catch (err) {
      setError(getErrorMessage(err, "Could not load chat requests"));
    } finally {
      setLoadingRequests(false);
    }
  }, [canManageChatRequests]);

  const respondRequest = useCallback(
    async (requestId, action) => {
      try {
        const res = await api.post(`/chat/request/${requestId}/respond`, { action });
        const updatedReq = res.data?.request;
        setChatRequests((prev) =>
          prev.map((req) => (normalizeId(req._id) === normalizeId(updatedReq?._id) ? updatedReq : req))
        );

        if (action === "accepted" && updatedReq) {
          const peer =
            normalizeId(updatedReq.requester?._id) === normalizeId(meId)
              ? updatedReq.receiver
              : updatedReq.requester;
          if (peer?._id) {
            addOrActivateContact(peer);
          }
        }
      } catch (err) {
        setError(getErrorMessage(err, "Could not respond to request"));
      }
    },
    [addOrActivateContact, meId]
  );

  const cancelRequest = useCallback(async (requestId) => {
    try {
      const res = await api.post(`/chat/request/${requestId}/cancel`);
      const updatedReq = res.data?.request;
      if (updatedReq?._id) {
        setChatRequests((prev) =>
          prev.map((req) => (normalizeId(req._id) === normalizeId(updatedReq._id) ? updatedReq : req))
        );
      } else {
        setChatRequests((prev) => prev.filter((req) => normalizeId(req._id) !== normalizeId(requestId)));
      }
    } catch (err) {
      setError(getErrorMessage(err, "Could not cancel request"));
    }
  }, []);

  const removeRequest = useCallback(async (requestId) => {
    try {
      await api.delete(`/chat/request/${requestId}`);
      setChatRequests((prev) => prev.filter((req) => normalizeId(req._id) !== normalizeId(requestId)));
    } catch (err) {
      setError(getErrorMessage(err, "Could not remove request"));
    }
  }, []);

  const fetchMessages = useCallback(
    async (contactId, options = { appendHistory: false, before: "", query: "" }) => {
      if (!contactId) return;

      try {
        setLoadingMessages(true);
        const params = new URLSearchParams();
        params.set("limit", String(PAGE_SIZE));

        if (options.appendHistory && options.before) {
          params.set("before", options.before);
        }
        const searchQuery = (options.query || "").trim();
        if (searchQuery) {
          params.set("q", searchQuery);
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
          setOldestCursor(list.length > 0 ? list[0].createdAt || "" : "");
        }
      } catch (err) {
        setError(getErrorMessage(err, "Could not load messages"));
      } finally {
        setLoadingMessages(false);
      }
    },
    []
  );

  const markConversationRead = useCallback(async (contactId) => {
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
  }, []);

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
        socketRef.current.emit("chat:send", { receiverId, text, clientId }, (response) => {
          if (!response?.ok) {
            setMessages((prev) =>
              prev.map((msg) =>
                msg.clientId === clientId ? { ...msg, status: "failed", optimistic: false } : msg
              )
            );
            setError(response?.message || "Message failed to send");
            return;
          }

          const saved = response.message;
          upsertMessage(saved);
          updateContactPreview(receiverId, saved.text, saved.createdAt);
        });
      } else {
        const res = await api.post("/chat", { receiverId, text, clientId });
        const saved = res.data;
        upsertMessage(saved);
        updateContactPreview(receiverId, saved.text, saved.createdAt);
      }
    } catch (err) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.clientId === clientId ? { ...msg, status: "failed", optimistic: false } : msg
        )
      );
      setError(getErrorMessage(err, "Message failed to send"));
    }
  }, [activeContactId, input, meId, updateContactPreview, upsertMessage]);

  useEffect(() => {
    fetchContacts();
    fetchRequests();
  }, [fetchContacts, fetchRequests]);

  useEffect(() => {
    const target = location.state?.chatTarget;
    const targetId = normalizeId(target?._id || target?.id);
    if (targetId) {
      addOrActivateContact({ ...target, _id: targetId });
    }
  }, [addOrActivateContact, location.state]);

  useEffect(() => {
    if (!canManageChatRequests) return undefined;
    const timer = setInterval(() => {
      fetchRequests();
    }, 10000);
    return () => clearInterval(timer);
  }, [canManageChatRequests, fetchRequests]);

  useEffect(() => {
    if (!canManageChatRequests) return;
    const acceptedPeers = chatRequests
      .filter((r) => r.status === "accepted")
      .map((r) =>
        normalizeId(r.requester?._id) === normalizeId(meId) ? r.receiver : r.requester
      )
      .filter(Boolean);

    if (acceptedPeers.length === 0) return;

    setContacts((prev) => {
      const existing = new Set(prev.map((c) => normalizeId(c.user?._id)));
      const additions = acceptedPeers
        .filter((peer) => !existing.has(normalizeId(peer?._id)))
        .map((peer) => ({
          user: peer,
          lastMessage: "",
          lastAt: new Date(0).toISOString(),
          lastStatus: "sent",
          unreadCount: 0,
          isOnline: false,
        }));
      if (additions.length === 0) return prev;
      return [...additions, ...prev];
    });

    if (!activeContactId) {
      const firstAcceptedPeerId = normalizeId(acceptedPeers[0]?._id);
      if (firstAcceptedPeerId) {
        setActiveContactId(firstAcceptedPeerId);
      }
    }
  }, [activeContactId, canManageChatRequests, chatRequests, meId]);

  useEffect(() => {
    if (!activeContactId) return;
    let cancelled = false;

    const loadConversation = async () => {
      await fetchMessages(activeContactId, { appendHistory: false, query: debouncedMessageSearch });
      if (!cancelled && !debouncedMessageSearch) {
        markConversationRead(activeContactId);
      }
    };

    loadConversation();
    return () => {
      cancelled = true;
    };
  }, [activeContactId, debouncedMessageSearch, fetchMessages, markConversationRead]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const token = user?.token;
    if (!token) return undefined;

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

    socket.on("disconnect", () => setSocketConnected(false));

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
      setTypingByContact((prev) => ({ ...prev, [fromUserId]: Boolean(isTyping) }));
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

    socket.on("chat:request:new", ({ request }) => {
      if (!request) return;
      setChatRequests((prev) => [request, ...prev]);
    });

    socket.on("chat:request:update", ({ request }) => {
      if (!request) return;
      setChatRequests((prev) => {
        const exists = prev.some((r) => normalizeId(r._id) === normalizeId(request._id));
        if (!exists) return [request, ...prev];
        return prev.map((r) => (normalizeId(r._id) === normalizeId(request._id) ? request : r));
      });
    });

    socket.on("chat:request:removed", ({ requestId }) => {
      if (!requestId) return;
      setChatRequests((prev) => prev.filter((r) => normalizeId(r._id) !== normalizeId(requestId)));
    });

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      socket.removeAllListeners();
      socket.disconnect();
      socketRef.current = null;
    };
  }, [markConversationRead, upsertMessage, user?.token]);

  const onTypingChange = (value) => {
    setInput(value);
    if (!socketRef.current?.connected || !activeContactId) return;

    socketRef.current.emit("chat:typing", { receiverId: activeContactId, isTyping: true });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);

    typingTimeoutRef.current = setTimeout(() => {
      socketRef.current?.emit("chat:typing", { receiverId: activeContactId, isTyping: false });
    }, 1200);
  };

  const openContactConversation = (contactId) => {
    setActiveContactId(contactId);
    if (window.innerWidth < 768) {
      setMobilePanel("chat");
    }
  };

  const showContactsPanel = () => {
    setMobilePanel("contacts");
  };

  return (
    <div className="max-w-7xl mx-auto px-1.5 sm:px-4 pb-2">
      <div className="md:hidden mb-2 flex items-center gap-2">
        <button
          onClick={() => setMobilePanel("contacts")}
          className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border ${
            mobilePanel === "contacts" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-700 border-slate-300"
          }`}
        >
          <FiUsers size={15} /> Chats
        </button>
        <button
          onClick={() => setMobilePanel("chat")}
          className={`flex-1 inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium border ${
            mobilePanel === "chat" ? "bg-blue-600 text-white border-blue-600" : "bg-white text-slate-700 border-slate-300"
          }`}
        >
          <FiMessageSquare size={15} /> Conversation
        </button>
      </div>

      <div className="h-[calc(100dvh-170px)] min-h-[420px] sm:h-[calc(100dvh-160px)] sm:min-h-[460px] md:h-[calc(100dvh-190px)] md:min-h-[540px] rounded-2xl border border-slate-200 bg-white shadow-lg overflow-hidden md:grid md:grid-cols-[340px,1fr]">
        <aside className={`${mobilePanel === "chat" ? "hidden" : "flex"} md:flex flex-col bg-slate-50 border-r border-slate-200`}>
          <div className="p-4 border-b border-slate-200 bg-white">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-slate-800">Messages</h2>
              <div className="flex items-center gap-2">
                <span className={`text-xs font-medium ${socketConnected ? "text-emerald-600" : "text-amber-600"}`}>
                  {socketConnected ? "Live" : "Reconnecting"}
                </span>
                <button
                  onClick={fetchContacts}
                  className="inline-flex items-center justify-center h-7 w-7 rounded border border-slate-300 hover:bg-slate-100"
                  title="Refresh chats"
                >
                  <FiRefreshCw size={13} />
                </button>
              </div>
            </div>
            <input
              value={contactSearch}
              onChange={(e) => setContactSearch(e.target.value)}
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
                  onClick={() => openContactConversation(cid)}
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

          {canManageChatRequests && (
            <div className="border-t border-slate-200 p-2 bg-white">
              <div className="flex items-center justify-between mb-2 gap-2">
                <p className="text-xs font-semibold text-slate-700">Chat Requests</p>
                <button
                  onClick={fetchRequests}
                  className="text-[11px] px-2 py-1 rounded border border-slate-300 hover:bg-slate-100"
                >
                  Refresh
                </button>
              </div>
              <div className="max-h-44 overflow-y-auto space-y-2 pr-1">
                <button
                  type="button"
                  onClick={() => setShowIncomingRequests((v) => !v)}
                  className="w-full text-left text-[11px] px-2 py-1.5 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 inline-flex items-center justify-between"
                >
                  <span className="font-medium text-slate-700">
                    Received ({incomingPending.length})
                  </span>
                  {showIncomingRequests ? <FiChevronDown size={13} /> : <FiChevronRight size={13} />}
                </button>

                {showIncomingRequests && (
                  <>
                    {loadingRequests && <p className="text-[11px] text-slate-500">Loading requests...</p>}
                    {!loadingRequests && incomingPending.length === 0 && (
                      <p className="text-[11px] text-slate-500 px-1">No received requests.</p>
                    )}
                    {incomingPending.map((req) => (
                      <div key={normalizeId(req._id)} className="rounded border border-slate-200 bg-slate-50 p-2">
                        <p className="text-xs font-medium text-slate-800 truncate">
                          {req.requester?.name} ({req.requester?.prn || "PRN"})
                        </p>
                        {req.note && <p className="text-[11px] text-slate-500 break-words mt-0.5">{req.note}</p>}
                        <div className="mt-2 flex flex-wrap gap-1">
                          <button
                            onClick={() => respondRequest(req._id, "accepted")}
                            className="text-[11px] px-2 py-1 rounded bg-emerald-600 text-white"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => respondRequest(req._id, "rejected")}
                            className="text-[11px] px-2 py-1 rounded border border-red-300 text-red-600"
                          >
                            Reject
                          </button>
                          <button
                            onClick={() => navigate(`/profile/visit/${normalizeId(req.requester?._id)}`)}
                            className="text-[11px] px-2 py-1 rounded border border-slate-300"
                          >
                            Profile
                          </button>
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {(isStudent || outgoingPending.length > 0) && (
                  <>
                    <button
                      type="button"
                      onClick={() => setShowOutgoingRequests((v) => !v)}
                      className="w-full text-left text-[11px] px-2 py-1.5 rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 inline-flex items-center justify-between"
                    >
                      <span className="font-medium text-slate-700">
                        Sent ({outgoingPending.length})
                      </span>
                      {showOutgoingRequests ? <FiChevronDown size={13} /> : <FiChevronRight size={13} />}
                    </button>

                    {showOutgoingRequests && (
                      <>
                        {!loadingRequests && outgoingPending.length === 0 && (
                          <p className="text-[11px] text-slate-500 px-1">No sent requests.</p>
                        )}
                        {outgoingPending.map((req) => (
                          <div key={normalizeId(req._id)} className="rounded border border-slate-200 bg-slate-50 p-2">
                            <p className="text-xs font-medium text-slate-800 truncate">
                              {req.receiver?.name} ({req.receiver?.prn || "PRN"})
                            </p>
                            {req.note && <p className="text-[11px] text-slate-500 break-words mt-0.5">{req.note}</p>}
                            <div className="mt-2 flex flex-wrap gap-1">
                              {isStudent && (
                                <button
                                  onClick={() => cancelRequest(req._id)}
                                  className="text-[11px] px-2 py-1 rounded border border-amber-300 text-amber-700"
                                >
                                  Cancel
                                </button>
                              )}
                              <button
                                onClick={() => removeRequest(req._id)}
                                className="text-[11px] px-2 py-1 rounded border border-slate-300"
                              >
                                Remove
                              </button>
                              <button
                                onClick={() => navigate(`/profile/visit/${normalizeId(req.receiver?._id)}`)}
                                className="text-[11px] px-2 py-1 rounded border border-slate-300"
                              >
                                Profile
                              </button>
                            </div>
                          </div>
                        ))}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </aside>

        <main className={`${mobilePanel === "contacts" ? "hidden" : "flex"} md:flex flex-col bg-white`}>
          {!activeContact && (
            <div className="h-full flex flex-col items-center justify-center text-slate-500 gap-3 p-6">
              <p>Select a conversation to start chatting.</p>
              <button
                onClick={showContactsPanel}
                className="md:hidden inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 text-sm"
              >
                <FiArrowLeft size={14} /> Back To Chats
              </button>
            </div>
          )}

          {activeContact && (
            <>
              <header className="border-b border-slate-200 p-2.5 sm:p-4 flex items-center justify-between bg-white">
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    onClick={showContactsPanel}
                    className="md:hidden inline-flex items-center justify-center h-8 w-8 rounded border border-slate-300 hover:bg-slate-100"
                    title="Back"
                  >
                    <FiArrowLeft size={14} />
                  </button>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-slate-900 truncate">{activeContact.user?.name}</h3>
                    <p className="text-xs text-slate-500">
                      {typingByContact[normalizeId(activeContact.user?._id)]
                        ? "Typing..."
                        : activeContact.isOnline
                          ? "Online"
                          : "Offline"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="hidden sm:block text-xs text-slate-500 truncate max-w-40">{activeContact.user?.email}</div>
                  <button
                    onClick={() => navigate(`/profile/visit/${normalizeId(activeContact.user?._id)}`)}
                    className="text-xs px-2 py-1 rounded border border-slate-300 hover:bg-slate-100"
                  >
                    View Profile
                  </button>
                </div>
              </header>

              <div className="px-3 sm:px-4 py-2 border-b border-slate-200 bg-slate-50">
                <input
                  value={messageSearch}
                  onChange={(e) => setMessageSearch(e.target.value)}
                  placeholder="Search in this conversation"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-3 bg-gradient-to-b from-slate-50 to-white">
                {hasMore && (
                  <div className="flex justify-center mb-3">
                    <button
                      type="button"
                      onClick={() =>
                        fetchMessages(activeContactId, {
                          appendHistory: true,
                          before: oldestCursor,
                          query: debouncedMessageSearch,
                        })
                      }
                      className="text-xs border border-slate-300 rounded-full px-3 py-1 hover:bg-slate-100"
                      disabled={loadingMessages}
                    >
                      {loadingMessages ? "Loading..." : "Load older messages"}
                    </button>
                  </div>
                )}

                {messages.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-8">No messages yet. Say hello.</p>
                )}

                <div className="space-y-2">
                  {messages.map((msg) => {
                    const mine = normalizeId(msg.sender) === normalizeId(meId);
                    return (
                      <div key={normalizeId(msg._id) || msg.clientId} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[90%] sm:max-w-[78%] rounded-2xl px-3 py-2 shadow-sm ${
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
                            {mine && <span className="text-[10px] text-blue-100">{statusLabel(msg.status)}</span>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div ref={messagesEndRef} />
              </div>

              <footer className="border-t border-slate-200 p-2 sm:p-3 bg-white">
                <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 px-3 py-2 shadow-sm">
                  <div className="mb-1 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Enter to send | Shift + Enter for new line</span>
                    <span>{input.trim().length}/2000</span>
                  </div>
                  <div className="flex items-end gap-2">
                    <textarea
                      rows={2}
                      maxLength={2000}
                      value={input}
                      onChange={(e) => onTypingChange(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          onSend();
                        }
                      }}
                      placeholder={`Message ${activeContact.user?.name || "user"}...`}
                      className="flex-1 resize-none rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      type="button"
                      onClick={onSend}
                      className="h-11 px-4 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:bg-blue-300 inline-flex items-center gap-2"
                      disabled={!input.trim()}
                    >
                      <FiSend size={14} /> Send
                    </button>
                  </div>
                </div>
              </footer>
            </>
          )}

          {error && <div className="border-t border-red-200 bg-red-50 px-4 py-2 text-xs text-red-700">{error}</div>}
        </main>
      </div>
    </div>
  );
}
