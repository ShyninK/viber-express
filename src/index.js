import express from "express";
import "dotenv/config";
import swaggerDocs from "./config/swagger.js";
import ticketsRoutes from "./routes/ticketsRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import knowledgeBaseRoutes from "./routes/knowledgeBaseRoutes.js";
import surveysRoutes from "./routes/surveysRoutes.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root route
app.get("/", (req, res) => {
  res.json({ 
    status: true, 
    message: "Selamat datang di API Viber",
    version: "1.0.0",
    endpoints: {
      health: "/api/v1/health",
      tickets: "/api/v1/tickets",
      notifications: "/api/v1/notifications",
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
// Tickets
app.use("/api/v1/tickets", ticketsRoutes);

// Notifications
app.use("/api/v1/notifications", notificationRoutes);

// Knowledge Base
app.use("/api/v1/knowledge-base", knowledgeBaseRoutes);

// Surveys
app.use("/api/v1/surveys", surveysRoutes);

// Swagger Documentation
swaggerDocs(app);

// Cloud Run uses PORT environment variable
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});

export default app;
