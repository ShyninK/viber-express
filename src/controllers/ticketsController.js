import * as ticketsModel from "../models/ticketsModel.js";
import * as notificationsModel from "../models/notificationsModel.js";

// Get all tickets
export const index = async (req, res) => {
  try {
    const tickets = await ticketsModel.getAllTickets();
    res.status(200).json({
      status: true,
      message: "Tickets retrieved successfully",
      data: tickets,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// Get ticket by ID
export const show = async (req, res) => {
  try {
    const { id } = req.params;
    const ticket = await ticketsModel.getTicketById(id);
    res.status(200).json({
      status: true,
      message: "Ticket retrieved successfully",
      data: ticket,
    });
  } catch (error) {
    res.status(404).json({
      status: false,
      message: error.message,
    });
  }
};

// Create new ticket and automatically create notification
export const store = async (req, res) => {
  try {
    const { title, description, status, assigned_to, created_by } = req.body;

    // Validate required fields
    if (!title || !description) {
      return res.status(400).json({
        status: false,
        message: "Title and description are required",
      });
    }

    // Create ticket
    const ticketData = {
      title,
      description,
      status: status || "open",
      assigned_to,
      created_by,
    };

    const newTicket = await ticketsModel.createTicket(ticketData);

    // OTOMATIS BUAT NOTIFIKASI untuk user yang di-assign
    if (assigned_to) {
      const notificationData = {
        user_id: assigned_to,
        type: "new_ticket",
        title: "Tiket Baru Ditugaskan",
        message: `Anda mendapat tiket baru: "${title}"`,
        reference_id: newTicket.id,
        reference_type: "ticket",
        is_read: false,
      };

      await notificationsModel.createNotification(notificationData);
    }

    res.status(201).json({
      status: true,
      message: "Ticket created successfully and notification sent",
      data: newTicket,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// Update ticket
export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, assigned_to } = req.body;

    const ticketData = {
      ...(title && { title }),
      ...(description && { description }),
      ...(status && { status }),
      ...(assigned_to && { assigned_to }),
    };

    const updatedTicket = await ticketsModel.updateTicket(id, ticketData);

    // Jika status berubah, kirim notifikasi
    if (status) {
      const notificationData = {
        user_id: updatedTicket.created_by,
        type: "ticket_status_update",
        title: "Status Tiket Diperbarui",
        message: `Tiket "${updatedTicket.title}" diperbarui menjadi ${status}`,
        reference_id: updatedTicket.id,
        reference_type: "ticket",
        is_read: false,
      };

      await notificationsModel.createNotification(notificationData);
    }

    res.status(200).json({
      status: true,
      message: "Ticket updated successfully",
      data: updatedTicket,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// Delete ticket
export const destroy = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedTicket = await ticketsModel.deleteTicket(id);
    res.status(200).json({
      status: true,
      message: "Ticket deleted successfully",
      data: deletedTicket,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// Get tickets by status
export const getByStatus = async (req, res) => {
  try {
    const { status } = req.params;
    const tickets = await ticketsModel.getTicketsByStatus(status);
    res.status(200).json({
      status: true,
      message: `Tickets with status '${status}' retrieved successfully`,
      data: tickets,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// Get tickets assigned to user
export const getAssignedTickets = async (req, res) => {
  try {
    const { userId } = req.params;
    const tickets = await ticketsModel.getTicketsByAssignedTo(userId);
    res.status(200).json({
      status: true,
      message: "Assigned tickets retrieved successfully",
      data: tickets,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};
