import supabase from "../config/supabase.js";

// Get all tickets
export const getAllTickets = async () => {
  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

// Get ticket by ID
export const getTicketById = async (id) => {
  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .eq("id", id)
    .single();

  if (error) throw error;
  return data;
};

// Create new ticket
export const createTicket = async (ticketData) => {
  const { data, error } = await supabase
    .from("tickets")
    .insert([ticketData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update ticket
export const updateTicket = async (id, ticketData) => {
  const { data, error } = await supabase
    .from("tickets")
    .update(ticketData)
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Delete ticket
export const deleteTicket = async (id) => {
  const { data, error } = await supabase
    .from("tickets")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Get tickets by status
export const getTicketsByStatus = async (status) => {
  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .eq("status", status)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

// Get tickets by assigned user
export const getTicketsByAssignedTo = async (userId) => {
  const { data, error } = await supabase
    .from("tickets")
    .select("*")
    .eq("assigned_to", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};
