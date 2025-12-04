// ===========================================
// SOCKET.IO REAL-TIME CHAT HANDLER
// ===========================================
const jwt = require("jsonwebtoken");

// Initialize Socket.IO with authentication and event handlers
const initializeSocket = (io, supabase, JWT_SECRET) => {
  // Middleware Autentikasi untuk Socket
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;

    if (!token) {
      return next(new Error("Authentication error: Token not found"));
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
      if (err) {
        return next(new Error("Authentication error: Invalid token"));
      }
      socket.user = decoded;
      next();
    });
  });

  // Event Handler Utama
  io.on("connection", (socket) => {
    console.log(`🔌 User connected: ${socket.user.username} (${socket.user.role})`);

    // 1. Join Room Tiket dengan Role-Based Access Control
    socket.on("join_ticket_chat", async (ticketId) => {
      try {
        // Validasi: Cek apakah user punya akses ke tiket ini
        const { data: ticket, error } = await supabase
          .from("tickets")
          .select("id, reporter_id, assigned_to, opd_id")
          .eq("id", ticketId)
          .single();

        if (error || !ticket) {
          socket.emit("error", { message: "Ticket tidak ditemukan" });
          return;
        }

        // Role-based access control
        const userRole = socket.user.role;
        const userId = socket.user.id;
        const userOpdId = socket.user.opd_id;
        let hasAccess = false;

        if (userRole === "admin_kota" || userRole === "super_admin") {
          hasAccess = true;
        } else if (userRole === "pengguna" || userRole === "pegawai_opd") {
          hasAccess = ticket.reporter_id === userId;
        } else if (userRole === "teknisi") {
          hasAccess = ticket.assigned_to === userId;
        } else if (["admin_opd", "bidang", "seksi", "helpdesk"].includes(userRole)) {
          hasAccess = ticket.opd_id === userOpdId;
        }

        if (!hasAccess) {
          socket.emit("error", { message: "Anda tidak memiliki akses ke chat tiket ini" });
          return;
        }

        // Join room
        const roomName = `ticket_${ticketId}`;
        socket.join(roomName);
        socket.currentTicketRoom = roomName;
        
        console.log(`✅ User ${socket.user.username} joined room: ${roomName}`);
        socket.emit("joined_chat", { ticketId, message: "Berhasil join chat" });

        // Load chat history (50 pesan terakhir)
        const { data: messages } = await supabase
          .from("ticket_comments")
          .select(`
            *,
            user:user_id(id, username, full_name, role)
          `)
          .eq("ticket_id", ticketId)
          .eq("is_internal", false)
          .order("created_at", { ascending: false })
          .limit(50);

        socket.emit("chat_history", { messages: (messages || []).reverse() });

      } catch (err) {
        console.error("❌ Join chat error:", err.message);
        socket.emit("error", { message: "Terjadi kesalahan saat join chat" });
      }
    });

    // 2. Kirim Pesan (Event: send_message)
    socket.on("send_message", async (data) => {
      const { ticketId, message } = data;

      if (!message || !message.trim()) {
        socket.emit("error", { message: "Pesan tidak boleh kosong" });
        return;
      }

      try {
        // Validasi akses ticket
        const { data: ticket, error: ticketError } = await supabase
          .from("tickets")
          .select("id, reporter_id, assigned_to, opd_id")
          .eq("id", ticketId)
          .single();

        if (ticketError || !ticket) {
          socket.emit("error", { message: "Ticket tidak ditemukan" });
          return;
        }

        // Simpan ke database
        const { data: savedComment, error } = await supabase
          .from("ticket_comments")
          .insert({
            ticket_id: ticketId,
            user_id: socket.user.id,
            content: message.trim(),
            is_internal: false,
            created_at: new Date()
          })
          .select(`
            *,
            user:user_id(id, username, full_name, role)
          `)
          .single();

        if (error) throw error;

        // Log activity
        await supabase.from("ticket_logs").insert({
          ticket_id: ticketId,
          user_id: socket.user.id,
          action: "chat_message",
          description: `Chat: ${message.substring(0, 50)}${message.length > 50 ? '...' : ''}`
        });

        // Broadcast ke semua user di room
        io.to(`ticket_${ticketId}`).emit("new_message", {
          id: savedComment.id,
          ticketId: ticketId,
          message: savedComment.content,
          senderId: savedComment.user_id,
          senderName: savedComment.user.full_name,
          senderUsername: savedComment.user.username,
          senderRole: savedComment.user.role,
          timestamp: savedComment.created_at,
          isInternal: savedComment.is_internal
        });

        console.log(`💬 Message from ${socket.user.username} in ticket ${ticketId}`);

      } catch (err) {
        console.error("❌ Send message error:", err.message);
        socket.emit("error", { message: "Gagal mengirim pesan" });
      }
    });

    // 3. Typing Indicator
    socket.on("typing_start", (data) => {
      if (socket.currentTicketRoom) {
        socket.to(socket.currentTicketRoom).emit("user_typing", {
          userId: socket.user.id,
          username: socket.user.username,
          fullName: socket.user.full_name || socket.user.username
        });
      }
    });

    socket.on("typing_stop", () => {
      if (socket.currentTicketRoom) {
        socket.to(socket.currentTicketRoom).emit("user_stopped_typing", {
          userId: socket.user.id
        });
      }
    });

    socket.on("disconnect", () => {
      console.log(`❌ User disconnected: ${socket.user.username}`);
    });
  });
};

module.exports = { initializeSocket };
