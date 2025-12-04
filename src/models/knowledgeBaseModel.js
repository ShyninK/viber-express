import supabase from "../config/supabase.js";

// Get all knowledge base
export const getAllKnowledgeBase = async () => {
  const { data, error } = await supabase
    .from("o_knowledge_base")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

// Get knowledge base by ID
export const getKnowledgeBaseById = async (id) => {
  const { data, error } = await supabase
    .from("o_knowledge_base")
    .select("*")
    .eq("id_kb", id)
    .single();

  if (error) throw error;
  return data;
};

// Get active knowledge base only
export const getActiveKnowledgeBase = async () => {
  const { data, error } = await supabase
    .from("o_knowledge_base")
    .select("*")
    .eq("is_active", 1)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

// Get knowledge base by category
export const getKnowledgeBaseByCategory = async (category) => {
  const { data, error } = await supabase
    .from("o_knowledge_base")
    .select("*")
    .eq("kategori_kb", category)
    .eq("is_active", 1)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

// Create knowledge base
export const createKnowledgeBase = async (kbData) => {
  const { judul_kb, kategori_kb, deskripsi_kb, created_by } = kbData;

  const { data, error } = await supabase
    .from("o_knowledge_base")
    .insert({
      judul_kb,
      kategori_kb,
      deskripsi_kb,
      created_by,
      is_active: 1
    })
    .select("*")
    .single();

  if (error) throw error;
  return data;
};

// Update knowledge base
export const updateKnowledgeBase = async (id, kbData) => {
  const { judul_kb, kategori_kb, deskripsi_kb, updated_by, is_active } = kbData;

  const updateData = {
    updated_at: new Date().toISOString()
  };

  if (judul_kb !== undefined) updateData.judul_kb = judul_kb;
  if (kategori_kb !== undefined) updateData.kategori_kb = kategori_kb;
  if (deskripsi_kb !== undefined) updateData.deskripsi_kb = deskripsi_kb;
  if (updated_by !== undefined) updateData.updated_by = updated_by;
  if (is_active !== undefined) updateData.is_active = is_active;

  const { data, error } = await supabase
    .from("o_knowledge_base")
    .update(updateData)
    .eq("id_kb", id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
};

// Delete knowledge base (soft delete)
export const softDeleteKnowledgeBase = async (id, userId) => {
  const { data, error } = await supabase
    .from("o_knowledge_base")
    .update({
      is_active: 0,
      updated_by: userId,
      updated_at: new Date().toISOString()
    })
    .eq("id_kb", id)
    .select("*")
    .single();

  if (error) throw error;
  return data;
};

// Delete knowledge base (hard delete)
export const deleteKnowledgeBase = async (id) => {
  const { error } = await supabase
    .from("o_knowledge_base")
    .delete()
    .eq("id_kb", id);

  if (error) throw error;
  return { success: true };
};

// Search knowledge base
export const searchKnowledgeBase = async (keyword) => {
  const { data, error } = await supabase
    .from("o_knowledge_base")
    .select("*")
    .or(`judul_kb.ilike.%${keyword}%,deskripsi_kb.ilike.%${keyword}%`)
    .eq("is_active", 1)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};
