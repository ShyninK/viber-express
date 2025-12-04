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
