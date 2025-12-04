import * as kbModel from "../models/knowledgeBaseModel.js";

// Get all knowledge base
export const index = async (req, res) => {
  try {
    const { active, category, search } = req.query;

    let data;

    if (search) {
      data = await kbModel.searchKnowledgeBase(search);
    } else if (category) {
      data = await kbModel.getKnowledgeBaseByCategory(category);
    } else if (active === "true") {
      data = await kbModel.getActiveKnowledgeBase();
    } else {
      data = await kbModel.getAllKnowledgeBase();
    }

    res.status(200).json({ status: true, data });
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
};

// Get knowledge base by ID
export const getById = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await kbModel.getKnowledgeBaseById(id);

    if (!data) {
      return res.status(404).json({ 
        status: false, 
        error: "Knowledge base tidak ditemukan" 
      });
    }

    res.status(200).json({ status: true, data });
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
};

// Create knowledge base
export const create = async (req, res) => {
  try {
    const { judul_kb, kategori_kb, deskripsi_kb } = req.body;

    // Validation
    if (!judul_kb || !deskripsi_kb) {
      return res.status(400).json({
        status: false,
        error: "Judul dan deskripsi wajib diisi"
      });
    }

    const kbData = {
      judul_kb,
      kategori_kb,
      deskripsi_kb,
      created_by: req.user?.id || null
    };

    const data = await kbModel.createKnowledgeBase(kbData);

    res.status(201).json({
      status: true,
      message: "Knowledge base berhasil dibuat",
      data
    });
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
};

// Update knowledge base
export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { judul_kb, kategori_kb, deskripsi_kb, is_active } = req.body;

    const kbData = {
      judul_kb,
      kategori_kb,
      deskripsi_kb,
      is_active,
      updated_by: req.user?.id || null
    };

    const data = await kbModel.updateKnowledgeBase(id, kbData);

    res.status(200).json({
      status: true,
      message: "Knowledge base berhasil diupdate",
      data
    });
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
};

// Soft delete knowledge base
export const softDelete = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || null;

    const data = await kbModel.softDeleteKnowledgeBase(id, userId);

    res.status(200).json({
      status: true,
      message: "Knowledge base berhasil dinonaktifkan",
      data
    });
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
};

// Hard delete knowledge base
export const hardDelete = async (req, res) => {
  try {
    const { id } = req.params;

    await kbModel.deleteKnowledgeBase(id);

    res.status(200).json({
      status: true,
      message: "Knowledge base berhasil dihapus permanen"
    });
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
};
