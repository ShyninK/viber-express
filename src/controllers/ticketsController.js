import {
  createTicket,
  getTicketById,
  getAllTickets,
  updateTicket,
  deleteTicket,
  generateTicketNumber,
} from "../models/ticketsModel.js";
import { sendTicketNotificationToHelpdesk } from "./notificationController.js";

/**
 * Create new ticket and send WhatsApp notification
 */
export const createNewTicket = async (req, res) => {
  try {
    const ticketData = req.body;

    // Validate required fields
    if (!ticketData.type || !ticketData.title || !ticketData.description) {
      return res.status(400).json({
        status: false,
        message: "Type, title, and description are required",
      });
    }

    // Generate ticket number if not provided
    if (!ticketData.ticket_number) {
      ticketData.ticket_number = await generateTicketNumber(ticketData.type);
    }

    // Set default values
    ticketData.status = ticketData.status || "open";
    ticketData.priority = ticketData.priority || "medium";
    ticketData.created_at = new Date().toISOString();
    ticketData.updated_at = new Date().toISOString();

    console.log("📝 Creating new ticket:", ticketData.ticket_number);

    // Create ticket in database
    const newTicket = await createTicket(ticketData);

    console.log("✅ Ticket created successfully:", newTicket.id);

    // Send WhatsApp notification
    let notificationResult = null;
    try {
      console.log("📤 Sending WhatsApp notification...");
      notificationResult = await sendTicketNotificationToHelpdesk(newTicket);
      console.log("✅ Notification sent:", notificationResult);
    } catch (notifError) {
      console.error("⚠️ Failed to send notification, but ticket was created:", notifError);
      // Don't fail the request if notification fails
    }

    res.status(201).json({
      status: true,
      message: "Ticket created successfully",
      data: {
        ticket: newTicket,
        notification: notificationResult,
      },
    });
  } catch (error) {
    console.error("Error in createNewTicket:", error);
    res.status(500).json({
      status: false,
      message: "Failed to create ticket",
      error: error.message,
    });
  }
};

/**
 * Get all tickets
 */
export const getTickets = async (req, res) => {
  try {
    const filters = {
      status: req.query.status,
      priority: req.query.priority,
      reporter_id: req.query.reporter_id,
      opd_id: req.query.opd_id,
    };

    const tickets = await getAllTickets(filters);

    res.status(200).json({
      status: true,
      message: "Tickets retrieved successfully",
      data: tickets,
      count: tickets.length,
    });
  } catch (error) {
    console.error("Error in getTickets:", error);
    res.status(500).json({
      status: false,
      message: "Failed to retrieve tickets",
      error: error.message,
    });
  }
};

/**
 * Get ticket by ID
 */
export const getTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const ticket = await getTicketById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        status: false,
        message: "Ticket not found",
      });
    }

    res.status(200).json({
      status: true,
      message: "Ticket retrieved successfully",
      data: ticket,
    });
  } catch (error) {
    console.error("Error in getTicket:", error);
    res.status(500).json({
      status: false,
      message: "Failed to retrieve ticket",
      error: error.message,
    });
  }
};

/**
 * Update ticket
 */
export const updateTicketById = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const updates = req.body;

    const updatedTicket = await updateTicket(ticketId, updates);

    res.status(200).json({
      status: true,
      message: "Ticket updated successfully",
      data: updatedTicket,
    });
  } catch (error) {
    console.error("Error in updateTicketById:", error);
    res.status(500).json({
      status: false,
      message: "Failed to update ticket",
      error: error.message,
    });
  }
};

/**
 * Delete ticket
 */
export const deleteTicketById = async (req, res) => {
  try {
    const { ticketId } = req.params;

    await deleteTicket(ticketId);

    res.status(200).json({
      status: true,
      message: "Ticket deleted successfully",
    });
  } catch (error) {
    console.error("Error in deleteTicketById:", error);
    res.status(500).json({
      status: false,
      message: "Failed to delete ticket",
      error: error.message,
    });
  }
};

/**
 * Resend notification for existing ticket
 */
export const resendTicketNotification = async (req, res) => {
  try {
    const { ticketId } = req.params;

    const ticket = await getTicketById(ticketId);

    if (!ticket) {
      return res.status(404).json({
        status: false,
        message: "Ticket not found",
      });
    }

    const notificationResult = await sendTicketNotificationToHelpdesk(ticket);

    res.status(200).json({
      status: true,
      message: "Notification sent successfully",
      data: notificationResult,
    });
  } catch (error) {
    console.error("Error in resendTicketNotification:", error);
    res.status(500).json({
      status: false,
      message: "Failed to send notification",
      error: error.message,
    });
  }
};

export default {
  createNewTicket,
  getTickets,
  getTicket,
  updateTicketById,
  deleteTicketById,
  resendTicketNotification,
};
