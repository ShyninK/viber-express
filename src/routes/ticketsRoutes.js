import express from "express";
import * as ticketsController from "../controllers/ticketsController.js";

const router = express.Router();

// Ticket routes
router.get("/", ticketsController.index); // GET /api/v1/tickets
router.get("/:id", ticketsController.show); // GET /api/v1/tickets/:id
router.post("/", ticketsController.store); // POST /api/v1/tickets
router.put("/:id", ticketsController.update); // PUT /api/v1/tickets/:id
router.patch("/:id", ticketsController.update); // PATCH /api/v1/tickets/:id
router.delete("/:id", ticketsController.destroy); // DELETE /api/v1/tickets/:id

// Additional routes
router.get("/status/:status", ticketsController.getByStatus); // GET /api/v1/tickets/status/:status
router.get("/assigned/:userId", ticketsController.getAssignedTickets); // GET /api/v1/tickets/assigned/:userId

export default router;
