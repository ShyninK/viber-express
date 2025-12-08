import supabase from "../config/supabase.js";

// Get all chat rooms
export const getAllRooms = async () => {
  const { data, error } = await supabase
    .from("chat_rooms")
    .select("*")
    .order("updated_at", { ascending: false });

  if (error) throw error;
  return data;
};

// Get room by ID
export const getRoomById = async (roomId) => {
  const { data, error } = await supabase
    .from("chat_rooms")
    .select("*")
    .eq("id", roomId)
    .single();

  if (error) throw error;
  return data;
};

// Create new chat room
export const createRoom = async (roomData) => {
  const { data, error } = await supabase
    .from("chat_rooms")
    .insert([roomData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Update room (last message, updated_at)
export const updateRoom = async (roomId, roomData) => {
  const { data, error } = await supabase
    .from("chat_rooms")
    .update({ ...roomData, updated_at: new Date().toISOString() })
    .eq("id", roomId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Get messages by room ID
export const getMessagesByRoom = async (roomId, limit = 50) => {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return data.reverse(); // Reverse untuk urutan ascending
};

// Create new message
export const createMessage = async (messageData) => {
  const { data, error } = await supabase
    .from("chat_messages")
    .insert([messageData])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Mark messages as read
export const markMessagesAsRead = async (roomId, userId) => {
  const { data, error } = await supabase
    .from("chat_messages")
    .update({ is_read: true, read_at: new Date().toISOString() })
    .eq("room_id", roomId)
    .neq("user_id", userId)
    .eq("is_read", false)
    .select();

  if (error) throw error;
  return data;
};

// Get unread message count
export const getUnreadCount = async (userId) => {
  const { count, error } = await supabase
    .from("chat_messages")
    .select("*", { count: "exact", head: true })
    .neq("user_id", userId)
    .eq("is_read", false);

  if (error) throw error;
  return count;
};

// Delete message
export const deleteMessage = async (messageId) => {
  const { data, error } = await supabase
    .from("chat_messages")
    .delete()
    .eq("id", messageId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Get rooms by user ID (user participated in)
export const getRoomsByUserId = async (userId) => {
  const { data, error } = await supabase
    .from("chat_room_participants")
    .select(`
      room_id,
      chat_rooms (*)
    `)
    .eq("user_id", userId);

  if (error) throw error;
  return data.map(item => item.chat_rooms);
};

// Add participant to room
export const addParticipant = async (roomId, userId) => {
  const { data, error } = await supabase
    .from("chat_room_participants")
    .insert([{ room_id: roomId, user_id: userId }])
    .select()
    .single();

  if (error) throw error;
  return data;
};

// Get participants by room
export const getParticipantsByRoom = async (roomId) => {
  const { data, error } = await supabase
    .from("chat_room_participants")
    .select("user_id")
    .eq("room_id", roomId);

  if (error) throw error;
  return data;
};
