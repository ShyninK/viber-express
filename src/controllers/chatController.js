import * as chatModel from "../models/chatModel.js";

// Socket.IO Setup - Handle realtime chat events
export const setupSocketIO = (io) => {
  // Store connected users
  const connectedUsers = new Map();

  io.on("connection", (socket) => {
    console.log(`✅ User connected: ${socket.id}`);

    // User join dengan user_id
    socket.on("user:join", async ({ userId, username }) => {
      socket.userId = userId;
      socket.username = username || `User ${userId}`;
      connectedUsers.set(userId, socket.id);
      
      console.log(`👤 ${socket.username} (${userId}) joined`);
      
      // Emit online users
      io.emit("users:online", Array.from(connectedUsers.keys()));
    });

    // Join room
    socket.on("room:join", async ({ roomId, userId }) => {
      socket.join(`room:${roomId}`);
      socket.currentRoom = roomId;
      
      console.log(`📂 User ${userId} joined room ${roomId}`);
      
      // Notify others in the room
      socket.to(`room:${roomId}`).emit("user:joined", {
        userId,
        username: socket.username,
        roomId,
        timestamp: new Date().toISOString()
      });

      // Mark messages as read
      try {
        await chatModel.markMessagesAsRead(roomId, userId);
      } catch (error) {
        console.error("Error marking messages as read:", error);
      }
    });

    // Leave room
    socket.on("room:leave", ({ roomId, userId }) => {
      socket.leave(`room:${roomId}`);
      socket.currentRoom = null;
      
      console.log(`📂 User ${userId} left room ${roomId}`);
      
      socket.to(`room:${roomId}`).emit("user:left", {
        userId,
        username: socket.username,
        roomId,
        timestamp: new Date().toISOString()
      });
    });

    // Send message
    socket.on("message:send", async (messageData) => {
      try {
        const { roomId, userId, message, username } = messageData;

        // Save to database
        const newMessage = await chatModel.createMessage({
          room_id: roomId,
          user_id: userId,
          message: message,
          is_read: false
        });

        // Update room last message
        await chatModel.updateRoom(roomId, {
          last_message: message,
          last_message_at: new Date().toISOString()
        });

        // Broadcast to room
        const messagePayload = {
          id: newMessage.id,
          roomId,
          userId,
          username: username || socket.username,
          message,
          createdAt: newMessage.created_at,
          isRead: false
        };

        // Emit to all users in room including sender
        io.to(`room:${roomId}`).emit("message:receive", messagePayload);

        console.log(`💬 Message sent in room ${roomId} by ${username}`);
      } catch (error) {
        console.error("Error sending message:", error);
        socket.emit("message:error", { error: error.message });
      }
    });

    // Typing indicator
    socket.on("typing:start", ({ roomId, userId, username }) => {
      socket.to(`room:${roomId}`).emit("typing:user", {
        userId,
        username: username || socket.username,
        isTyping: true
      });
    });

    socket.on("typing:stop", ({ roomId, userId, username }) => {
      socket.to(`room:${roomId}`).emit("typing:user", {
        userId,
        username: username || socket.username,
        isTyping: false
      });
    });

    // Message read receipt
    socket.on("message:read", async ({ roomId, userId }) => {
      try {
        await chatModel.markMessagesAsRead(roomId, userId);
        
        socket.to(`room:${roomId}`).emit("messages:read", {
          roomId,
          readBy: userId,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        console.error("Error marking as read:", error);
      }
    });

    // Disconnect
    socket.on("disconnect", () => {
      if (socket.userId) {
        connectedUsers.delete(socket.userId);
        console.log(`❌ ${socket.username} disconnected`);
        
        // Emit updated online users
        io.emit("users:online", Array.from(connectedUsers.keys()));
        
        // Notify room if user was in a room
        if (socket.currentRoom) {
          socket.to(`room:${socket.currentRoom}`).emit("user:left", {
            userId: socket.userId,
            username: socket.username,
            roomId: socket.currentRoom,
            timestamp: new Date().toISOString()
          });
        }
      }
    });
  });

  console.log("🔌 Socket.IO event handlers registered");
};

// REST API Controllers

// Get all rooms
export const getRooms = async (req, res) => {
  try {
    const rooms = await chatModel.getAllRooms();
    res.status(200).json({
      status: true,
      message: "Chat rooms retrieved successfully",
      data: rooms
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message
    });
  }
};

// Get room by ID
export const getRoomById = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await chatModel.getRoomById(roomId);
    res.status(200).json({
      status: true,
      message: "Chat room retrieved successfully",
      data: room
    });
  } catch (error) {
    res.status(404).json({
      status: false,
      message: error.message
    });
  }
};

// Create new room
export const createRoom = async (req, res) => {
  try {
    const { name, type, created_by } = req.body;

    if (!name) {
      return res.status(400).json({
        status: false,
        message: "Room name is required"
      });
    }

    const roomData = {
      name,
      type: type || "group",
      created_by
    };

    const newRoom = await chatModel.createRoom(roomData);

    // Add creator as participant
    if (created_by) {
      await chatModel.addParticipant(newRoom.id, created_by);
    }

    res.status(201).json({
      status: true,
      message: "Chat room created successfully",
      data: newRoom
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message
    });
  }
};

// Get messages by room
export const getMessages = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit } = req.query;
    
    const messages = await chatModel.getMessagesByRoom(roomId, limit ? parseInt(limit) : 50);
    
    res.status(200).json({
      status: true,
      message: "Messages retrieved successfully",
      data: messages
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message
    });
  }
};

// Get user's rooms
export const getUserRooms = async (req, res) => {
  try {
    const { userId } = req.params;
    const rooms = await chatModel.getRoomsByUserId(userId);
    
    res.status(200).json({
      status: true,
      message: "User rooms retrieved successfully",
      data: rooms
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message
    });
  }
};

// Add participant to room
export const addParticipant = async (req, res) => {
  try {
    const { roomId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({
        status: false,
        message: "userId is required"
      });
    }

    const participant = await chatModel.addParticipant(roomId, userId);

    // Notify via Socket.IO
    const io = req.app.get('io');
    io.to(`room:${roomId}`).emit("participant:added", {
      roomId,
      userId,
      timestamp: new Date().toISOString()
    });

    res.status(201).json({
      status: true,
      message: "Participant added successfully",
      data: participant
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message
    });
  }
};

// Get unread count
export const getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.params;
    const count = await chatModel.getUnreadCount(userId);
    
    res.status(200).json({
      status: true,
      message: "Unread count retrieved successfully",
      data: { count }
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message
    });
  }
};
