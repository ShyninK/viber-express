import supabase from "../config/supabase.js";

// Get all notifications for a user
export const getNotificationsByUserId = async (userId) => {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

// Get unread notifications for a user
export const getUnreadNotifications = async (userId) => {
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("user_id", userId)
    .eq("is_read", false)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

// Get unread notification count
export const getUnreadCount = async (userId) => {
  const { count, error } = await supabase
    .from("notifications")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);

  if (error) throw error;
  return count;
};

// Create notification
export const createNotification = async (notificationData) => {
  const { data, error } = await supabase
    .from("notifications")
    .insert([notificationData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Mark notification as read
export const markAsRead = async (id) => {
  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Mark all notifications as read for a user
export const markAllAsRead = async (userId) => {
  const { data, error } = await supabase
    .from("notifications")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("user_id", userId)
    .eq("is_read", false)
    .select();

  if (error) throw error;
  return data;
};

// Delete notification
export const deleteNotification = async (id) => {
  const { data, error } = await supabase
    .from("notifications")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Delete all read notifications for a user
export const deleteReadNotifications = async (userId) => {
  const { data, error } = await supabase
    .from("notifications")
    .delete()
    .eq("user_id", userId)
    .eq("is_read", true)
    .select();

  if (error) throw error;
  return data;
};
