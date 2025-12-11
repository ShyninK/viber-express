import supabase from "../config/supabase.js";

/**
 * Create new ticket
 */
export const createTicket = async (ticketData) => {
  try {
    const { data, error } = await supabase
      .from("tickets")
      .insert([ticketData])
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error in createTicket:", error);
    throw error;
  }
};

/**
 * Get ticket by ID
 */
export const getTicketById = async (ticketId) => {
  try {
    const { data, error } = await supabase
      .from("tickets")
      .select("*")
      .eq("id", ticketId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error in getTicketById:", error);
    throw error;
  }
};

/**
 * Get all tickets
 */
export const getAllTickets = async (filters = {}) => {
  try {
    let query = supabase.from("tickets").select("*");

    // Apply filters if provided
    if (filters.status) {
      query = query.eq("status", filters.status);
    }
    if (filters.priority) {
      query = query.eq("priority", filters.priority);
    }
    if (filters.reporter_id) {
      query = query.eq("reporter_id", filters.reporter_id);
    }
    if (filters.opd_id) {
      query = query.eq("opd_id", filters.opd_id);
    }

    // Order by created_at desc
    query = query.order("created_at", { ascending: false });

    const { data, error } = await query;

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error in getAllTickets:", error);
    throw error;
  }
};

/**
 * Update ticket
 */
export const updateTicket = async (ticketId, updates) => {
  try {
    const { data, error } = await supabase
      .from("tickets")
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq("id", ticketId)
      .select()
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error in updateTicket:", error);
    throw error;
  }
};

/**
 * Delete ticket
 */
export const deleteTicket = async (ticketId) => {
  try {
    const { error } = await supabase
      .from("tickets")
      .delete()
      .eq("id", ticketId);

    if (error) throw error;
    return { success: true };
  } catch (error) {
    console.error("Error in deleteTicket:", error);
    throw error;
  }
};

/**
 * Generate ticket number
 */
export const generateTicketNumber = async (type = "incident") => {
  try {
    // Format: TIK-YYYYMMDD-XXX
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, "");
    const prefix = type === "incident" ? "INC" : "REQ";

    // Get count of tickets today
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    const { count, error } = await supabase
      .from("tickets")
      .select("*", { count: "exact", head: true })
      .gte("created_at", startOfDay)
      .lte("created_at", endOfDay);

    if (error) throw error;

    const sequence = String((count || 0) + 1).padStart(3, "0");
    return `${prefix}-${dateStr}-${sequence}`;
  } catch (error) {
    console.error("Error in generateTicketNumber:", error);
    // Fallback to random if error
    return `TIK-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }
};

export default {
  createTicket,
  getTicketById,
  getAllTickets,
  updateTicket,
  deleteTicket,
  generateTicketNumber,
};
