import supabase from "../config/supabase.js";

/**
 * Create new notification
 */
export const createNotification = async (notificationData) => {
  const { data, error } = await supabase
    .from("notifications")
    .insert([notificationData])
    .select()
    .single();

  if (error) {
    console.error("Error creating notification:", error);
    throw error;
  }

  return data;
};

/**
 * Get all notifications for a user with related ticket info
 */
export const getNotificationsByUserId = async (userId, limit = 50) => {
  const { data, error } = await supabase
    .from("notifications")
    .select(`
      *,
      tickets:related_ticket_id (
        id,
        ticket_number,
        title,
        status,
        priority
      )
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }

  return data;
};

/**
 * Get notifications by type
 */
export const getNotificationsByType = async (userId, type, limit = 50) => {
  const { data, error } = await supabase
    .from("notifications")
    .select(`
      *,
      tickets:related_ticket_id (
        id,
        ticket_number,
        title,
        status
      )
    `)
    .eq("user_id", userId)
    .eq("type", type)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching notifications by type:", error);
    throw error;
  }

  return data;
};

/**
 * Get unread notifications count
 */
export const getUnreadCount = async (userId) => {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) {
    console.error("Error fetching unread count:", error);
    throw error;
  }

  return count;
};

/**
 * Mark notification as read
 */
export const markAsRead = async (notificationId) => {
  const { data, error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("id", notificationId)
    .select()
    .single();

  if (error) {
    console.error("Error marking notification as read:", error);
    throw error;
  }

  return data;
};

/**
 * Mark all notifications as read for a user
 */
export const markAllAsRead = async (userId) => {
  const { data, error } = await supabase
    .from("notifications")
    .update({
      is_read: true,
      read_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("is_read", false)
    .select();

  if (error) {
    console.error("Error marking all notifications as read:", error);
    throw error;
  }

  return data;
};

/**
 * Delete notification
 */
export const deleteNotification = async (notificationId) => {
  const { error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", notificationId);

  if (error) {
    console.error("Error deleting notification:", error);
    throw error;
  }

  return true;
};

/**
 * Get notification by ID with related data
 */
export const getNotificationById = async (notificationId) => {
  const { data, error } = await supabase
    .from("notifications")
    .select(`
      *,
      users:user_id (
        id,
        username,
        full_name,
        email
      ),
      tickets:related_ticket_id (
        id,
        ticket_number,
        title,
        status,
        priority
      )
    `)
    .eq("id", notificationId)
    .single();

  if (error) {
    console.error("Error fetching notification:", error);
    throw error;
  }

  return data;
};

/**
 * Get notifications by ticket ID with user info
 */
export const getNotificationsByTicketId = async (ticketId) => {
  const { data, error } = await supabase
    .from("notifications")
    .select(`
      *,
      users:user_id (
        id,
        username,
        full_name
      )
    `)
    .eq("related_ticket_id", ticketId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching notifications by ticket:", error);
    throw error;
  }

  return data;
};

/**
 * Get all helpdesk users (for sending notifications)
 * Assumes users table has a 'role' column
 */
export const getHelpdeskUsers = async () => {
  const { data, error } = await supabase
    .from("users")
    .select("id, username, email, phone")
    .or("role.eq.helpdesk,role.eq.admin")
    .eq("is_active", true);

  if (error) {
    console.error("Error fetching helpdesk users:", error);
    throw error;
  }

  return data;
};

/**
 * Get user by ID
 */
export const getUserById = async (userId) => {
  const { data, error } = await supabase
    .from("users")
    .select("id, username, email, phone")
    .eq("id", userId)
    .single();

  if (error) {
    console.error("Error fetching user:", error);
    throw error;
  }

  return data;
};

export default {
  createNotification,
  getNotificationsByUserId,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationById,
  getNotificationsByTicketId,
  getHelpdeskUsers,
  getUserById,
};
