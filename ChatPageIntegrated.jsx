// src/pages/ChatPage.jsx
import React, { useState, useMemo, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FiSearch, FiSend, FiFilePlus, FiInfo, FiX } from "react-icons/fi";
import { io } from "socket.io-client";
import Input from "../components/Input";

// --- Mock Data untuk Conversations (akan diganti dengan API) ---
const mockConversations = [
  {
    id: 1,
    roomId: 1, // Room ID dari backend
    name: "Bisma Pargoy",
    avatar: "https://i.pravatar.cc/150?u=pegawai@opd.go.id",
    lastMessage: "Yang di ruang arsip, printer laserjet",
    unread: 2,
    role: "pegawai_opd",
    opd: "Sekretariat DPRD",
    email: "pegawai@opd.go.id",
  },
  {
    id: 2,
    roomId: 2,
    name: "Warga A",
    avatar: "https://i.pravatar.cc/150?u=warga@mail.com",
    lastMessage: "Bagaimana cara lapor kerusakan?",
    unread: 0,
    role: "masyarakat",
    email: "warga@mail.com",
  },
  {
    id: 3,
    roomId: 3,
    name: "Andi",
    avatar: "https://i.pravatar.cc/150?u=teknisi@siladan.go.id",
    lastMessage: "Siap, laksanakan",
    unread: 0,
    role: "teknisi",
    opd: "Internal",
  },
  {
    id: 4,
    roomId: 4,
    name: "Warga B",
    avatar: "https://i.pravatar.cc/150?u=admin@kota.go.id",
    lastMessage: "Mau minta tolong dong",
    unread: 1,
    role: "admin_kota",
    opd: "Internal",
  },
];

// Current user info (ganti dengan data dari auth/context)
const CURRENT_USER = {
  id: 999, // Ganti dengan user ID yang login
  username: "Helpdesk Admin", // Ganti dengan username yang login
};

const ChatPage = () => {
  const [selectedId, setSelectedId] = useState(mockConversations[0].id);
  const [newMessage, setNewMessage] = useState("");
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState({});
  const [typingUsers, setTypingUsers] = useState(new Set());
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [isTyping, setIsTyping] = useState(false);

  const navigate = useNavigate();
  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  // Find active conversation and user
  const activeConversation = useMemo(
    () => messages[selectedId] || [],
    [selectedId, messages]
  );

  const activeUser = useMemo(
    () => mockConversations.find((c) => c.id === selectedId),
    [selectedId]
  );

  const activeRoomId = activeUser?.roomId;

  // ====== SOCKET.IO CONNECTION ======
  useEffect(() => {
    // Connect to backend Socket.IO server
    const socketInstance = io("http://localhost:8080", {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
    });

    socketInstance.on("connect", () => {
      console.log("✅ Socket.IO connected:", socketInstance.id);
      setIsConnected(true);

      // Join as user (WAJIB!)
      socketInstance.emit("user:join", {
        userId: CURRENT_USER.id,
        username: CURRENT_USER.username,
      });
    });

    socketInstance.on("disconnect", (reason) => {
      console.log("❌ Socket.IO disconnected:", reason);
      setIsConnected(false);
    });

    socketInstance.on("connect_error", (error) => {
      console.error("⚠️ Socket.IO connection error:", error);
    });

    // ====== RECEIVE MESSAGES ======
    socketInstance.on("message:receive", (data) => {
      console.log("📨 New message received:", data);
      
      setMessages((prev) => ({
        ...prev,
        [data.roomId]: [
          ...(prev[data.roomId] || []),
          {
            id: data.id,
            sender: data.userId === CURRENT_USER.id ? "helpdesk" : "user",
            text: data.message,
            username: data.username,
            createdAt: data.createdAt,
          },
        ],
      }));
    });

    // ====== ONLINE USERS ======
    socketInstance.on("users:online", (userIds) => {
      console.log("👥 Online users:", userIds);
      setOnlineUsers(userIds);
    });

    // ====== USER JOINED/LEFT ======
    socketInstance.on("user:joined", (data) => {
      console.log("👋 User joined:", data.username);
    });

    socketInstance.on("user:left", (data) => {
      console.log("👋 User left:", data.username);
    });

    // ====== TYPING INDICATOR ======
    socketInstance.on("typing:user", (data) => {
      if (data.userId !== CURRENT_USER.id) {
        setTypingUsers((prev) => {
          const newSet = new Set(prev);
          if (data.isTyping) {
            newSet.add(data.username);
          } else {
            newSet.delete(data.username);
          }
          return newSet;
        });
      }
    });

    // ====== MESSAGES READ ======
    socketInstance.on("messages:read", (data) => {
      console.log("✓✓ Messages read in room:", data.roomId);
    });

    // ====== ERROR HANDLING ======
    socketInstance.on("message:error", (data) => {
      console.error("❌ Socket error:", data.error);
      alert("Error: " + data.error);
    });

    setSocket(socketInstance);

    // Cleanup on unmount
    return () => {
      if (socketInstance) {
        socketInstance.emit("room:leave", {
          roomId: activeRoomId,
          userId: CURRENT_USER.id,
        });
        socketInstance.disconnect();
      }
    };
  }, []);

  // ====== JOIN ROOM WHEN CONVERSATION CHANGES ======
  useEffect(() => {
    if (!socket || !isConnected || !activeRoomId) return;

    console.log("📂 Joining room:", activeRoomId);

    // Leave previous room if any
    if (socket.previousRoomId && socket.previousRoomId !== activeRoomId) {
      socket.emit("room:leave", {
        roomId: socket.previousRoomId,
        userId: CURRENT_USER.id,
      });
    }

    // Join new room
    socket.emit("room:join", {
      roomId: activeRoomId,
      userId: CURRENT_USER.id,
    });

    // Store current room ID for cleanup
    socket.previousRoomId = activeRoomId;

    // Load message history from backend
    loadMessageHistory(activeRoomId);
  }, [socket, isConnected, activeRoomId]);

  // ====== LOAD MESSAGE HISTORY ======
  const loadMessageHistory = async (roomId) => {
    try {
      const response = await fetch(
        `http://localhost:8080/api/v1/chat/rooms/${roomId}/messages?limit=50`
      );
      const result = await response.json();

      if (result.status) {
        const formattedMessages = result.data.map((msg) => ({
          id: msg.id,
          sender: msg.user_id === CURRENT_USER.id ? "helpdesk" : "user",
          text: msg.message,
          username: msg.user_id === CURRENT_USER.id ? "You" : `User ${msg.user_id}`,
          createdAt: msg.created_at,
        }));

        setMessages((prev) => ({
          ...prev,
          [roomId]: formattedMessages,
        }));
      }
    } catch (error) {
      console.error("Error loading message history:", error);
    }
  };

  // ====== AUTO-SCROLL ======
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeConversation]);

  // ====== SEND MESSAGE ======
  const handleSendMessage = (e) => {
    e.preventDefault();
    if (newMessage.trim() === "" || !socket || !isConnected) return;

    console.log("📤 Sending message:", newMessage);

    // Emit message via Socket.IO
    socket.emit("message:send", {
      roomId: activeRoomId,
      userId: CURRENT_USER.id,
      username: CURRENT_USER.username,
      message: newMessage,
    });

    setNewMessage("");
    stopTyping();
  };

  // ====== TYPING INDICATOR ======
  const handleInputChange = (e) => {
    setNewMessage(e.target.value);

    if (!socket || !isConnected) return;

    if (e.target.value.trim() !== "") {
      if (!isTyping) {
        setIsTyping(true);
        socket.emit("typing:start", {
          roomId: activeRoomId,
          userId: CURRENT_USER.id,
          username: CURRENT_USER.username,
        });
      }

      // Reset timeout
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping();
      }, 2000);
    } else {
      stopTyping();
    }
  };

  const stopTyping = () => {
    if (isTyping && socket && isConnected) {
      setIsTyping(false);
      socket.emit("typing:stop", {
        roomId: activeRoomId,
        userId: CURRENT_USER.id,
        username: CURRENT_USER.username,
      });
    }
    clearTimeout(typingTimeoutRef.current);
  };

  // ====== CREATE TICKET ======
  const handleCreateTicketClick = () => {
    navigate("/dashboard/new-ticket", {
      state: { prefillUser: activeUser },
    });
  };

  if (!activeUser) {
    return <div className="dark:text-white">Memuat percakapan...</div>;
  }

  return (
    <>
      <div className="flex flex-col md:flex-row h-full gap-4 md:gap-6">
        {/* --- COLUMN 1: INBOX CHAT --- */}
        <div className="flex flex-col h-1/3 md:h-full w-full md:w-1/3 lg:w-1/4 rounded-lg shadow-lg bg-white dark:bg-slate-800">
          {/* Header Inbox */}
          <div className="border-b p-4 border-slate-200 dark:border-slate-700">
            <Input
              id="search-chat"
              placeholder="Cari percakapan..."
              rightIcon={<FiSearch />}
            />
          </div>
          {/* List Chat */}
          <div className="flex-1 p-2 space-y-1 overflow-y-auto scrollbar-thin">
            {mockConversations.map((convo) => (
              <InboxItem
                key={convo.id}
                convo={convo}
                isActive={convo.id === selectedId}
                onClick={() => setSelectedId(convo.id)}
                isOnline={onlineUsers.includes(convo.id)}
              />
            ))}
          </div>
        </div>

        {/* --- COLUMN 2: CHAT WINDOW --- */}
        <div className="flex flex-1 flex-col md:h-full w-full md:w-2/4 lg:w-3/4 rounded-lg shadow-lg bg-white dark:bg-slate-800">
          {/* Header Chat Active */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-b border-slate-200 dark:border-slate-700">
            {/* Info User */}
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative">
                <img
                  src={activeUser.avatar}
                  alt={activeUser.name}
                  className="h-10 w-10 rounded-full object-cover"
                />
                {onlineUsers.includes(activeUser.id) && (
                  <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
                )}
              </div>

              <div className="min-w-0">
                <h3 className="font-semibold text-slate-900 dark:text-white truncate">
                  {activeUser.name}
                </h3>
                <p className={`text-xs ${isConnected ? 'text-green-500' : 'text-slate-400'}`}>
                  {isConnected ? (onlineUsers.includes(activeUser.id) ? 'Online' : 'Offline') : 'Disconnected'}
                </p>
              </div>
            </div>

            <div className="flex flex-shrink-0 items-center gap-2">
              <button
                onClick={() => setIsInfoModalOpen(true)}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 cursor-pointer"
                aria-label="Lihat Info"
              >
                <FiInfo size={20} />
              </button>
              <button
                onClick={handleCreateTicketClick}
                className="flex min-h-[44px] min-w-[44px] items-center justify-center gap-2 rounded-lg bg-[#F7AD19] px-3 py-2 text-base font-semibold text-[#053F5C] hover:bg-yellow-400 cursor-pointer"
                aria-label="Buat Tiket"
              >
                <FiFilePlus size={20} />
                <span className="hidden sm:inline">Buat Tiket</span>
              </button>
            </div>
          </div>

          {/* Content Chat */}
          <div className="flex-1 p-4 space-y-4 overflow-y-auto scrollbar-thin">
            {activeConversation.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400">
                Belum ada pesan. Mulai percakapan!
              </div>
            ) : (
              activeConversation.map((msg, index) => (
                <ChatMessage key={msg.id || index} message={msg} />
              ))
            )}
            
            {/* Typing Indicator */}
            {typingUsers.size > 0 && (
              <div className="flex justify-start">
                <div className="max-w-xs rounded-lg px-4 py-2 bg-slate-100 dark:bg-slate-700">
                  <span className="text-sm text-slate-500 dark:text-slate-400 italic">
                    {Array.from(typingUsers).join(", ")} sedang mengetik...
                  </span>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Input Send Message */}
          <form
            onSubmit={handleSendMessage}
            className="flex items-end gap-2 border-t p-4 border-slate-200 dark:border-slate-700"
          >
            <Input
              id="message-input"
              className="flex-1"
              placeholder={isConnected ? "Ketik balasan Anda..." : "Connecting..."}
              value={newMessage}
              onChange={handleInputChange}
              disabled={!isConnected}
            />
            <button
              type="submit"
              disabled={!isConnected || newMessage.trim() === ""}
              className={`flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-lg text-white ${
                isConnected && newMessage.trim() !== ""
                  ? "bg-[#429EBD] hover:bg-[#053F5C] cursor-pointer"
                  : "bg-slate-300 cursor-not-allowed"
              }`}
            >
              <FiSend />
            </button>
          </form>
        </div>
      </div>

      {isInfoModalOpen && (
        <UserInfoModal
          user={activeUser}
          onClose={() => setIsInfoModalOpen(false)}
        />
      )}
    </>
  );
};

// --- MODAL FOR USER INFO ---
const UserInfoModal = ({ user, onClose }) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-slate-800 rounded-lg shadow-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Informasi Pengguna
          </h2>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 cursor-pointer"
          >
            <FiX size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <InfoRow label="Nama" value={user.name} />
          <InfoRow label="Email" value={user.email} />
          <InfoRow label="Peran" value={user.role} />
          {user.opd && <InfoRow label="OPD" value={user.opd} />}
        </div>
      </div>
    </div>
  );
};

const InboxItem = ({ convo, isActive, onClick, isOnline }) => (
  <button
    onClick={onClick}
    className={`flex w-full items-center gap-3 rounded-md p-3 text-left transition-colors ${
      isActive
        ? "bg-slate-100 dark:bg-slate-700"
        : "hover:bg-slate-50 dark:hover:bg-slate-700/50"
    }`}
  >
    <div className="relative">
      <img
        src={convo.avatar}
        alt={convo.name}
        className="h-10 w-10 flex-shrink-0 rounded-full object-cover"
      />
      {isOnline && (
        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white"></span>
      )}
    </div>
    <div className="min-w-0 flex-1">
      <p className="truncate font-semibold text-slate-800 dark:text-slate-200">
        {convo.name}
      </p>
      <p className="truncate text-sm text-slate-500 dark:text-slate-400">
        {convo.lastMessage}
      </p>
    </div>
    {convo.unread > 0 && (
      <span className="rounded-full bg-red-500 px-2 py-0.5 text-xs font-bold text-white">
        {convo.unread}
      </span>
    )}
  </button>
);

const ChatMessage = ({ message }) => {
  const isUser = message.sender === "user";
  return (
    <div className={`flex ${isUser ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-xs rounded-lg px-4 py-2 lg:max-w-md ${
          isUser
            ? "bg-slate-100 text-slate-800 dark:bg-slate-700 dark:text-slate-200"
            : "bg-[#429EBD] text-white"
        }`}
      >
        <p className="break-words">{message.text}</p>
        {message.createdAt && (
          <p className="text-xs mt-1 opacity-70">
            {new Date(message.createdAt).toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        )}
      </div>
    </div>
  );
};

const InfoRow = ({ label, value }) => (
  <div className="break-words">
    <dt className="text-sm font-medium text-slate-500 dark:text-slate-400">
      {label}
    </dt>
    <dd className="mt-1 text-base font-medium text-slate-900 dark:text-white">
      {value}
    </dd>
  </div>
);

export default ChatPage;
