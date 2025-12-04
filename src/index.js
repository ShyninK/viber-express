import express from "express";
import "dotenv/config";
import swaggerDocs from "./config/swagger.js";
// import tiketRoutes from "./routes/tiketRoutes.js";
// import knowledgeBaseRoutes from "./routes/knowledgeBaseRoutes.js";
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
      surveys: "/api/v1/surveys"
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
// Ticket
// app.use("/api/v1/tiket", tiketRoutes);

// Knowledge Base
// app.use("/api/v1/knowledge-base", knowledgeBaseRoutes);

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
