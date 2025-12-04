import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Viber API Documentation",
      version: "1.0.0",
      description: "API documentation for Viber application",
      contact: {
        name: "API Support",
        email: "support@viber.com"
      }
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server"
      },
      {
        url: "http://localhost:8080",
        description: "Cloud Run local"
      },
      {
        url: process.env.PRODUCTION_URL || "https://your-app.run.app",
        description: "Production server"
      }
    ]
  },
  apis: ["./src/docs/*.js", "./src/routes/*.js"]
};

const swaggerSpec = swaggerJsdoc(options);

const swaggerDocs = (app) => {
  // Swagger UI
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customSiteTitle: "Viber API Docs",
    customCss: '.swagger-ui .topbar { display: none }'
  }));

  // JSON spec
  app.get("/api-docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });

  console.log(`📚 Swagger docs available at /api-docs`);
};

export default swaggerDocs;
