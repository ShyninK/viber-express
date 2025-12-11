import express from "express";
import * as articleController from "../controllers/articleController.js";

const router = express.Router();

/**
 * @route   GET /api/v1/articles
 * @desc    Get all articles with optional filters
 * @query   kategori_artikel, target_pembaca, kata_kunci, id_ticket, created_by
 * @access  Public
 */
router.get("/", articleController.getArticles);

/**
 * @route   GET /api/v1/articles/search
 * @desc    Search articles by keyword
 * @query   keyword (required)
 * @access  Public
 */
router.get("/search", articleController.searchArticles);

/**
 * @route   GET /api/v1/articles/categories
 * @desc    Get all article categories
 * @access  Public
 */
router.get("/categories", articleController.getCategories);

/**
 * @route   GET /api/v1/articles/stats
 * @desc    Get article statistics
 * @access  Public
 */
router.get("/stats", articleController.getStats);

/**
 * @route   GET /api/v1/articles/category/:kategori
 * @desc    Get articles by category
 * @access  Public
 */
router.get("/category/:kategori", articleController.getArticlesByCategory);

/**
 * @route   GET /api/v1/articles/:id
 * @desc    Get article by ID
 * @access  Public
 */
router.get("/:id", articleController.getArticleById);

/**
 * @route   GET /api/v1/articles/ticket/:ticketId
 * @desc    Get articles by ticket ID
 * @access  Public
 */
router.get("/ticket/:ticketId", articleController.getArticlesByTicket);

/**
 * @route   POST /api/v1/articles
 * @desc    Create new article
 * @access  Private
 */
router.post("/", articleController.createArticle);

/**
 * @route   PUT /api/v1/articles/:id
 * @desc    Update article
 * @access  Private
 */
router.put("/:id", articleController.updateArticle);

/**
 * @route   DELETE /api/v1/articles/:id
 * @desc    Delete article (soft delete)
 * @access  Private
 */
router.delete("/:id", articleController.deleteArticle);

export default router;
