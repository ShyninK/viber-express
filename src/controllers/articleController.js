import * as articleModel from "../models/articleModel.js";

/**
 * Get all articles
 * Query params: kategori_artikel, target_pembaca, kata_kunci, id_ticket, created_by
 */
export const getArticles = async (req, res) => {
  try {
    const filters = {
      kategori_artikel: req.query.kategori_artikel,
      target_pembaca: req.query.target_pembaca,
      kata_kunci: req.query.kata_kunci,
      id_ticket: req.query.id_ticket,
      created_by: req.query.created_by,
    };

    const articles = await articleModel.getAllArticles(filters);

    res.status(200).json({
      status: true,
      message: "Articles retrieved successfully",
      data: articles,
    });
  } catch (error) {
    console.error("Error in getArticles:", error);
    res.status(500).json({
      status: false,
      message: "Failed to retrieve articles",
      error: error.message,
    });
  }
};

/**
 * Get article by ID
 */
export const getArticleById = async (req, res) => {
  try {
    const { id } = req.params;
    const article = await articleModel.getArticleById(id);

    if (!article) {
      return res.status(404).json({
        status: false,
        message: "Article not found",
      });
    }

    res.status(200).json({
      status: true,
      message: "Article retrieved successfully",
      data: article,
    });
  } catch (error) {
    console.error("Error in getArticleById:", error);
    res.status(500).json({
      status: false,
      message: "Failed to retrieve article",
      error: error.message,
    });
  }
};

/**
 * Get articles by ticket ID
 */
export const getArticlesByTicket = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const articles = await articleModel.getArticlesByTicketId(ticketId);

    res.status(200).json({
      status: true,
      message: "Articles retrieved successfully",
      data: articles,
    });
  } catch (error) {
    console.error("Error in getArticlesByTicket:", error);
    res.status(500).json({
      status: false,
      message: "Failed to retrieve articles",
      error: error.message,
    });
  }
};

/**
 * Create new article
 */
export const createArticle = async (req, res) => {
  try {
    const {
      id_ticket,
      judul_artikel,
      kategori_artikel,
      target_pembaca,
      kata_kunci,
      deskripsi_artikel,
      penyebab,
      penyelesaian,
      lampiran,
      created_by,
    } = req.body;

    // Validation
    if (!judul_artikel || !kategori_artikel || !target_pembaca || !kata_kunci || !deskripsi_artikel || !penyelesaian) {
      return res.status(400).json({
        status: false,
        message: "Missing required fields",
      });
    }

    const articleData = {
      id_ticket,
      judul_artikel,
      kategori_artikel,
      target_pembaca,
      kata_kunci,
      deskripsi_artikel,
      penyebab,
      penyelesaian,
      lampiran,
      created_by,
    };

    const newArticle = await articleModel.createArticle(articleData);

    res.status(201).json({
      status: true,
      message: "Article created successfully",
      data: newArticle,
    });
  } catch (error) {
    console.error("Error in createArticle:", error);
    res.status(500).json({
      status: false,
      message: "Failed to create article",
      error: error.message,
    });
  }
};

/**
 * Update article
 */
export const updateArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      id_ticket,
      judul_artikel,
      kategori_artikel,
      target_pembaca,
      kata_kunci,
      deskripsi_artikel,
      penyebab,
      penyelesaian,
      lampiran,
    } = req.body;

    const articleData = {
      id_ticket,
      judul_artikel,
      kategori_artikel,
      target_pembaca,
      kata_kunci,
      deskripsi_artikel,
      penyebab,
      penyelesaian,
      lampiran,
    };

    // Remove undefined values
    Object.keys(articleData).forEach(
      (key) => articleData[key] === undefined && delete articleData[key]
    );

    const updatedArticle = await articleModel.updateArticle(id, articleData);

    res.status(200).json({
      status: true,
      message: "Article updated successfully",
      data: updatedArticle,
    });
  } catch (error) {
    console.error("Error in updateArticle:", error);
    res.status(500).json({
      status: false,
      message: "Failed to update article",
      error: error.message,
    });
  }
};

/**
 * Delete article (soft delete)
 */
export const deleteArticle = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedArticle = await articleModel.deleteArticle(id);

    res.status(200).json({
      status: true,
      message: "Article deleted successfully",
      data: deletedArticle,
    });
  } catch (error) {
    console.error("Error in deleteArticle:", error);
    res.status(500).json({
      status: false,
      message: "Failed to delete article",
      error: error.message,
    });
  }
};

/**
 * Search articles
 */
export const searchArticles = async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword) {
      return res.status(400).json({
        status: false,
        message: "Keyword is required",
      });
    }

    const articles = await articleModel.searchArticles(keyword);

    res.status(200).json({
      status: true,
      message: "Articles searched successfully",
      data: articles,
    });
  } catch (error) {
    console.error("Error in searchArticles:", error);
    res.status(500).json({
      status: false,
      message: "Failed to search articles",
      error: error.message,
    });
  }
};

/**
 * Get articles by category
 */
export const getArticlesByCategory = async (req, res) => {
  try {
    const { kategori } = req.params;
    const articles = await articleModel.getArticlesByCategory(kategori);

    res.status(200).json({
      status: true,
      message: "Articles retrieved successfully",
      data: articles,
    });
  } catch (error) {
    console.error("Error in getArticlesByCategory:", error);
    res.status(500).json({
      status: false,
      message: "Failed to retrieve articles by category",
      error: error.message,
    });
  }
};

/**
 * Get all article categories
 */
export const getCategories = async (req, res) => {
  try {
    const categories = await articleModel.getArticleCategories();

    res.status(200).json({
      status: true,
      message: "Categories retrieved successfully",
      data: categories,
    });
  } catch (error) {
    console.error("Error in getCategories:", error);
    res.status(500).json({
      status: false,
      message: "Failed to retrieve categories",
      error: error.message,
    });
  }
};

/**
 * Get article statistics
 */
export const getStats = async (req, res) => {
  try {
    const stats = await articleModel.getArticleStats();

    res.status(200).json({
      status: true,
      message: "Statistics retrieved successfully",
      data: stats,
    });
  } catch (error) {
    console.error("Error in getStats:", error);
    res.status(500).json({
      status: false,
      message: "Failed to retrieve statistics",
      error: error.message,
    });
  }
};

export default {
  getArticles,
  getArticleById,
  getArticlesByTicket,
  createArticle,
  updateArticle,
  deleteArticle,
  searchArticles,
  getArticlesByCategory,
  getCategories,
  getStats,
};
