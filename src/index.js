import express from "express";
import "dotenv/config";
import { createServer } from "http";
import { Server } from "socket.io";
import cors from "cors";
import swaggerDocs from "./config/swagger.js";
import knowledgeBaseRoutes from "./routes/knowledgeBaseRoutes.js";
import surveysRoutes from "./routes/surveysRoutes.js";
import chatRoutes from "./routes/chatRoutes.js";
import { setupSocketIO } from "./controllers/chatController.js";

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make io accessible in routes
app.set('io', io);

// Root route
app.get("/", (req, res) => {
  res.json({ 
    status: true, 
    message: "Selamat datang di API Viber",
    version: "1.0.0",
    endpoints: {
      health: "/api/v1/health",
      chat: "/api/v1/chat",
      surveys: "/api/v1/surveys",
      knowledgeBase: "/api/v1/knowledge-base"
    }
  });
});

// Health check endpoint (untuk Cloud Run, monitoring, load balancer)
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development"
  });
});

// API v1 routes
// Chat
app.use("/api/v1/chat", chatRoutes);

// Knowledge Base
app.use("/api/v1/knowledge-base", knowledgeBaseRoutes);

// Surveys
app.use("/api/v1/surveys", surveysRoutes);

// Setup Socket.IO
setupSocketIO(io);

// Swagger Documentation
swaggerDocs(app);

// Cloud Run uses PORT environment variable
const port = process.env.PORT || 3000;
httpServer.listen(port, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${port}`);
  console.log(`💬 Socket.IO ready for realtime chat`);
});

export default app;
