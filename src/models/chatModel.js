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

// Get chat list for a user with details
export const getChatListForUser = async (userId) => {
  // Step 1: Get room IDs
  const { data: roomParticipants, error: roomError } = await supabase
    .from("chat_room_participants")
    .select("room_id")
    .eq("user_id", userId);
    
  if (roomError) throw roomError;
  const roomIds = roomParticipants.map(r => r.room_id);
  
  if (roomIds.length === 0) return [];

  // Step 2: Get rooms with last message
  const { data: rooms, error: roomsError } = await supabase
    .from("chat_rooms")
    .select("*")
    .in("id", roomIds)
    .order("updated_at", { ascending: false });
    
  if (roomsError) throw roomsError;

  // Step 3: Process each room
  const chatList = await Promise.all(rooms.map(async (room) => {
    // Get other participant
    const { data: participants } = await supabase
      .from("chat_room_participants")
      .select("user_id")
      .eq("room_id", room.id)
      .neq("user_id", userId)
      .limit(1)
      .single();
      
    if (!participants) return null; 
    
    const otherUserId = participants.user_id;
    
    // Get user details with OPD
    const { data: user } = await supabase
      .from("users")
      .select(`
        id, username, full_name, email, role,
        opd ( name )
      `)
      .eq("id", otherUserId)
      .single();
      
    if (!user) return null;
    
    // Get unread count
    const { count } = await supabase
      .from("chat_messages")
      .select("*", { count: "exact", head: true })
      .eq("room_id", room.id)
      .neq("user_id", userId)
      .eq("is_read", false);
      
    return {
      id: user.id,
      name: user.full_name || user.username,
      avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(user.full_name || user.username)}&background=random`,
      lastMessage: room.last_message || "",
      unread: count || 0,
      role: user.role,
      opd: user.opd?.name || "Unknown OPD",
      email: user.email,
      roomId: room.id
    };
  }));
  
  return chatList.filter(Boolean);
};

// ==========================================
// TICKET COMMENTS (Chat per Tiket)
// ==========================================

/**
 * Get comments for a ticket
 */
export const getTicketComments = async (ticketId) => {
  const { data, error } = await supabase
    .from("ticket_comments")
    .select(`
      *,
      user:user_id (
        id,
        username,
        full_name,
        role,
        avatar_url
      )
    `)
    .eq("ticket_id", ticketId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
};

/**
 * Create ticket comment
 */
export const createTicketComment = async (commentData) => {
  const { data, error } = await supabase
    .from("ticket_comments")
    .insert([{
      ticket_id: commentData.ticket_id,
      user_id: commentData.user_id,
      content: commentData.content,
      is_internal: commentData.is_internal || false
    }])
    .select(`
      *,
      user:user_id (
        id,
        username,
        full_name,
        role
      )
    `)
    .single();

  if (error) throw error;
  return data;
};

/**
 * Delete ticket comment
 */
export const deleteTicketComment = async (commentId) => {
  const { data, error } = await supabase
    .from("ticket_comments")
    .delete()
    .eq("id", commentId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

/**
 * Get public comments only (non-internal)
 */
export const getPublicTicketComments = async (ticketId) => {
  const { data, error } = await supabase
    .from("ticket_comments")
    .select(`
      *,
      user:user_id (
        id,
        username,
        full_name
      )
    `)
    .eq("ticket_id", ticketId)
    .eq("is_internal", false)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
};

/**
 * Get internal comments only (for technicians)
 */
export const getInternalTicketComments = async (ticketId) => {
  const { data, error } = await supabase
    .from("ticket_comments")
    .select(`
      *,
      user:user_id (
        id,
        username,
        full_name,
        role
      )
    `)
    .eq("ticket_id", ticketId)
    .eq("is_internal", true)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return data;
};

/**
 * Count comments per ticket
 */
export const getTicketCommentCount = async (ticketId) => {
  const { count, error } = await supabase
    .from("ticket_comments")
    .select("*", { count: "exact", head: true })
    .eq("ticket_id", ticketId);

  if (error) throw error;
  return count;
};
