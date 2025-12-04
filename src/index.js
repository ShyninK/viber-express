import express from "express";
import "dotenv/config";
// import swaggerDocs from "./swagger/docs.js";
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
    version: "1.0.0"
  });
});

// Ticket
// app.use("/tiket", tiketRoutes);

// Knowledge Base
// app.use("/knowledge-base", knowledgeBaseRoutes);

// Surveys
app.use("/surveys", surveysRoutes);

// Swagger
// swaggerDocs(app);

// Cloud Run uses PORT environment variable
const port = process.env.PORT || 8080;
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running on port ${port}`);
});

export default app;
