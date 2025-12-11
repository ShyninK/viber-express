import supabase from "../config/supabase.js";

/**
 * Get all articles with creator info
 */
export const getAllArticles = async (filters = {}) => {
  let query = supabase
    .from("o_ticket_articles")
    .select(`
      *,
      creator:created_by (
        id,
        username,
        full_name
      ),
      ticket:id_ticket (
        id,
        ticket_number,
        title,
        status
      )
    `)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  // Apply filters
  if (filters.kategori_artikel) {
    query = query.eq("kategori_artikel", filters.kategori_artikel);
  }
  if (filters.target_pembaca) {
    query = query.eq("target_pembaca", filters.target_pembaca);
  }
  if (filters.kata_kunci) {
    query = query.ilike("kata_kunci", `%${filters.kata_kunci}%`);
  }
  if (filters.id_ticket) {
    query = query.eq("id_ticket", filters.id_ticket);
  }
  if (filters.created_by) {
    query = query.eq("created_by", filters.created_by);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching articles:", error);
    throw error;
  }

  return data;
};

/**
 * Get article by ID with full details
 */
export const getArticleById = async (id) => {
  const { data, error } = await supabase
    .from("o_ticket_articles")
    .select(`
      *,
      creator:created_by (
        id,
        username,
        full_name,
        email
      ),
      ticket:id_ticket (
        id,
        ticket_number,
        title,
        description,
        status,
        priority,
        category
      )
    `)
    .eq("id_artikel", id)
    .eq("is_active", true)
    .single();

  if (error) {
    console.error("Error fetching article:", error);
    throw error;
  }

  return data;
};

/**
 * Get articles by ticket ID with creator info
 */
export const getArticlesByTicketId = async (ticketId) => {
  const { data, error } = await supabase
    .from("o_ticket_articles")
    .select(`
      *,
      creator:created_by (
        id,
        username,
        full_name
      )
    `)
    .eq("id_ticket", ticketId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching articles by ticket:", error);
    throw error;
  }

  return data;
};

/**
 * Create new article
 */
export const createArticle = async (articleData) => {
  const { data, error } = await supabase
    .from("o_ticket_articles")
    .insert([articleData])
    .select()
    .single();

  if (error) {
    console.error("Error creating article:", error);
    throw error;
  }

  return data;
};

/**
 * Update article
 */
export const updateArticle = async (id, articleData) => {
  const { data, error } = await supabase
    .from("o_ticket_articles")
    .update(articleData)
    .eq("id_artikel", id)
    .select()
    .single();

  if (error) {
    console.error("Error updating article:", error);
    throw error;
  }

  return data;
};

/**
 * Soft delete article (set is_active to false)
 */
export const deleteArticle = async (id) => {
  const { data, error } = await supabase
    .from("o_ticket_articles")
    .update({ is_active: false })
    .eq("id_artikel", id)
    .select()
    .single();

  if (error) {
    console.error("Error deleting article:", error);
    throw error;
  }

  return data;
};

/**
 * Search articles by keyword with creator info
 */
export const searchArticles = async (keyword) => {
  const { data, error } = await supabase
    .from("o_ticket_articles")
    .select(`
      *,
      creator:created_by (
        id,
        username,
        full_name
      ),
      ticket:id_ticket (
        id,
        ticket_number,
        title
      )
    `)
    .eq("is_active", true)
    .or(`judul_artikel.ilike.%${keyword}%,deskripsi_artikel.ilike.%${keyword}%,kata_kunci.ilike.%${keyword}%,penyelesaian.ilike.%${keyword}%,penyebab.ilike.%${keyword}%`)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error searching articles:", error);
    throw error;
  }

  return data;
};

/**
 * Get articles by category
 */
export const getArticlesByCategory = async (kategori) => {
  const { data, error } = await supabase
    .from("o_ticket_articles")
    .select(`
      *,
      creator:created_by (
        id,
        username,
        full_name
      )
    `)
    .eq("is_active", true)
    .eq("kategori_artikel", kategori)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching articles by category:", error);
    throw error;
  }

  return data;
};

/**
 * Get article categories (distinct)
 */
export const getArticleCategories = async () => {
  const { data, error } = await supabase
    .from("o_ticket_articles")
    .select("kategori_artikel")
    .eq("is_active", true);

  if (error) {
    console.error("Error fetching categories:", error);
    throw error;
  }

  // Get unique categories
  const categories = [...new Set(data.map(item => item.kategori_artikel))].filter(Boolean);
  return categories;
};

/**
 * Get article statistics
 */
export const getArticleStats = async () => {
  const { data, error } = await supabase
    .from("o_ticket_articles")
    .select("id_artikel, kategori_artikel, target_pembaca")
    .eq("is_active", true);

  if (error) {
    console.error("Error fetching article stats:", error);
    throw error;
  }

  // Calculate stats
  const stats = {
    total: data.length,
    byCategory: {},
    byTargetPembaca: {}
  };

  data.forEach(article => {
    // Count by category
    if (article.kategori_artikel) {
      stats.byCategory[article.kategori_artikel] = (stats.byCategory[article.kategori_artikel] || 0) + 1;
    }
    // Count by target
    if (article.target_pembaca) {
      stats.byTargetPembaca[article.target_pembaca] = (stats.byTargetPembaca[article.target_pembaca] || 0) + 1;
    }
  });

  return stats;
};

export default {
  getAllArticles,
  getArticleById,
  getArticlesByTicketId,
  createArticle,
  updateArticle,
  deleteArticle,
  searchArticles,
  getArticlesByCategory,
  getArticleCategories,
  getArticleStats,
};
