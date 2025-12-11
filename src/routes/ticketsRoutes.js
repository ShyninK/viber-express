import express from "express";
import {
  createNewTicket,
  getTickets,
  getTicket,
  updateTicketById,
  deleteTicketById,
  resendTicketNotification,
} from "../controllers/ticketsController.js";

const router = express.Router();

/**
 * @route   POST /api/v1/tickets
 * @desc    Create new ticket and send WhatsApp notification
 * @access  Public
 */
router.post("/", createNewTicket);

/**
 * @route   GET /api/v1/tickets
 * @desc    Get all tickets (with optional filters)
 * @access  Public
 */
router.get("/", getTickets);

/**
 * @route   GET /api/v1/tickets/:ticketId
 * @desc    Get ticket by ID
 * @access  Public
 */
router.get("/:ticketId", getTicket);

/**
 * @route   PUT /api/v1/tickets/:ticketId
 * @desc    Update ticket by ID
 * @access  Public
 */
router.put("/:ticketId", updateTicketById);

/**
 * @route   DELETE /api/v1/tickets/:ticketId
 * @desc    Delete ticket by ID
 * @access  Public
 */
router.delete("/:ticketId", deleteTicketById);

/**
 * @route   POST /api/v1/tickets/:ticketId/resend-notification
 * @desc    Resend WhatsApp notification for existing ticket
 * @access  Public
 */
router.post("/:ticketId/resend-notification", resendTicketNotification);

export default router;
