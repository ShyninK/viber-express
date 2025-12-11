import express from "express";
import {
  getConfig,
  getHelpdeskTeam,
  getNotificationConfig,
  getTemplates,
  getTemplate,
  formatPhone,
  previewTemplate,
  updateConfig,
  getSystemStatus,
} from "../controllers/baileysConfigController.js";

const router = express.Router();

/**
 * @route   GET /api/v1/baileys-config/status
 * @desc    Get Baileys system status
 * @access  Public
 */
router.get("/status", getSystemStatus);

/**
 * @route   GET /api/v1/baileys-config
 * @desc    Get all Baileys configuration
 * @access  Public
 */
router.get("/", getConfig);

/**
 * @route   GET /api/v1/baileys-config/helpdesk
 * @desc    Get helpdesk team members
 * @access  Public
 */
router.get("/helpdesk", getHelpdeskTeam);

/**
 * @route   GET /api/v1/baileys-config/notifications
 * @desc    Get notification settings
 * @access  Public
 */
router.get("/notifications", getNotificationConfig);

/**
 * @route   GET /api/v1/baileys-config/templates
 * @desc    Get all message templates
 * @access  Public
 */
router.get("/templates", getTemplates);

/**
 * @route   GET /api/v1/baileys-config/templates/:templateName
 * @desc    Get specific message template
 * @access  Public
 */
router.get("/templates/:templateName", getTemplate);

/**
 * @route   POST /api/v1/baileys-config/templates/:templateName/preview
 * @desc    Preview message template with sample data
 * @access  Public
 */
router.post("/templates/:templateName/preview", previewTemplate);

/**
 * @route   POST /api/v1/baileys-config/format-phone
 * @desc    Format phone number according to config
 * @access  Public
 */
router.post("/format-phone", formatPhone);

/**
 * @route   PUT /api/v1/baileys-config
 * @desc    Update configuration (runtime only)
 * @access  Private
 */
router.put("/", updateConfig);

export default router;
