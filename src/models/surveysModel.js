import supabase from "../config/supabase.js";

// Get all surveys dengan data ticket
export const getAllSurveys = async () => {
  // Ambil semua surveys
  const { data: surveysData, error: surveysError } = await supabase
    .from("o_ticket_surveys")
    .select("*")
    .order("created_at", { ascending: false });

  if (surveysError) throw surveysError;

  // Ambil semua ticket
  const { data: ticketData, error: ticketError } = await supabase
    .from("tickets");

  if (ticketError) throw ticketError;

  // Manual join: gabungkan surveys dengan ticket
  const result = surveysData.map(survey => {
    const ticket = ticketData ? ticketData.find(t => t.id === survey.ticket_id) : null;
    return {
      ...survey,
      ticket: ticket || null
    };
  });

  return result;
};

// Get survey by ID
export const getSurveyById = async (id) => {
  const { data: survey, error } = await supabase
    .from("o_ticket_surveys")
    .select("*")
    .eq("id_surveys", id)
    .single();

  if (error) throw error;
  
  // Manual join dengan tickets
  if (survey && survey.ticket_id) {
    const { data: ticket } = await supabase
      .from("tickets")
      .select("*")
      .eq("id", survey.ticket_id)
      .single();
    
    survey.ticket = ticket || null;
  }
  
  // Manual join dengan creator (user)
  if (survey && survey.created_by) {
    const { data: creator } = await supabase
      .from("users")
      .select("id, username, full_name, email")
      .eq("id", survey.created_by)
      .single();
    
    survey.creator = creator || null;
  }

  return survey;
};

// Get surveys by user
export const getSurveysByUser = async (userId) => {
  const { data: surveys, error } = await supabase
    .from("o_ticket_surveys")
    .select("*")
    .eq("created_by", userId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  
  // Manual join dengan tickets untuk setiap survey
  if (surveys && surveys.length > 0) {
    const ticketIds = surveys.map(s => s.ticket_id).filter(Boolean);
    
    if (ticketIds.length > 0) {
      const { data: tickets } = await supabase
        .from("tickets")
        .select("*")
        .in("id", ticketIds);
      
      // Gabungkan data
      surveys.forEach(survey => {
        const ticket = tickets?.find(t => t.id === survey.ticket_id);
        survey.ticket = ticket || null;
      });
    }
  }
  
  return surveys;
};

// Check if ticket already has survey (one-to-one)
export const hasTicketSurvey = async (ticketId) => {
  const { data } = await supabase
    .from("o_ticket_surveys")
    .select("id_surveys")
    .eq("ticket_id", ticketId)
    .maybeSingle();

  return data !== null;
};

// Create survey
export const createSurvey = async (ticketId, userId, rating, feedback, category = null) => {
  // Check if ticket already has survey (one-to-one)
  const hasSurvey = await hasTicketSurvey(ticketId);
  
  if (hasSurvey) {
    throw new Error("Tiket ini sudah memiliki survey");
  }

  const { data: survey, error } = await supabase
    .from("o_ticket_surveys")
    .insert({
      ticket_id: ticketId,
      created_by: userId,
      rating,
      feedback,
      category
    })
    .select("*")
    .single();

  if (error) throw error;
  
  // Manual join dengan ticket
  if (survey && survey.ticket_id) {
    const { data: ticket } = await supabase
      .from("tickets")
      .select("*")
      .eq("id", survey.ticket_id)
      .single();
    
    survey.ticket = ticket || null;
  }
  
  // Manual join dengan creator
  if (survey && survey.created_by) {
    const { data: creator } = await supabase
      .from("users")
      .select("id, username, full_name")
      .eq("id", survey.created_by)
      .single();
    
    survey.creator = creator || null;
  }
  
  return survey;
};

// Get all surveys dengan join
export const getAllSurveysWithDetails = async () => {
  const { data: surveys, error } = await supabase
    .from("o_ticket_surveys")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  
  // Manual join dengan tickets
  if (surveys && surveys.length > 0) {
    const ticketIds = surveys.map(s => s.ticket_id).filter(Boolean);
    const userIds = surveys.map(s => s.created_by).filter(Boolean);
    
    let tickets = [];
    let users = [];
    
    if (ticketIds.length > 0) {
      const { data: ticketData } = await supabase
        .from("tickets")
        .select("*")
        .in("id", ticketIds);
      tickets = ticketData || [];
    }
    
    if (userIds.length > 0) {
      const { data: userData } = await supabase
        .from("users")
        .select("id, username, full_name, email")
        .in("id", userIds);
      users = userData || [];
    }
    
    // Gabungkan data
    surveys.forEach(survey => {
      survey.ticket = tickets.find(t => t.id === survey.ticket_id) || null;
      survey.creator = users.find(u => u.id === survey.created_by) || null;
    });
  }

  return surveys;
};