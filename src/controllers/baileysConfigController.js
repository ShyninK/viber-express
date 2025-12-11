import {
  getBaileysConfig,
  getActiveHelpdeskTeam,
  getMessageTemplate,
  formatPhoneNumber,
  getNotificationSettings,
  isNotificationEnabled,
  updateBaileysConfig,
  buildMessageFromTemplate,
} from "../models/baileysConfigModel.js";
import { isConnected } from "../config/baileys.js";

/**
 * Get all Baileys configuration
 */
export const getConfig = async (req, res) => {
  try {
    const config = getBaileysConfig();
    const whatsappConnected = isConnected();

    res.status(200).json({
      status: true,
      message: "Baileys configuration retrieved",
      data: {
        config,
        whatsappConnected,
      },
    });
  } catch (error) {
    console.error("Error in getConfig:", error);
    res.status(500).json({
      status: false,
      message: "Failed to get configuration",
      error: error.message,
    });
  }
};

/**
 * Get helpdesk team members
 */
export const getHelpdeskTeam = async (req, res) => {
  try {
    const team = getActiveHelpdeskTeam();

    res.status(200).json({
      status: true,
      message: "Helpdesk team retrieved",
      data: team,
    });
  } catch (error) {
    console.error("Error in getHelpdeskTeam:", error);
    res.status(500).json({
      status: false,
      message: "Failed to get helpdesk team",
      error: error.message,
    });
  }
};

/**
 * Get notification settings
 */
export const getNotificationConfig = async (req, res) => {
  try {
    const settings = getNotificationSettings();
    const enabled = isNotificationEnabled();

    res.status(200).json({
      status: true,
      message: "Notification settings retrieved",
      data: {
        settings,
        enabled,
      },
    });
  } catch (error) {
    console.error("Error in getNotificationConfig:", error);
    res.status(500).json({
      status: false,
      message: "Failed to get notification settings",
      error: error.message,
    });
  }
};

/**
 * Get message templates
 */
export const getTemplates = async (req, res) => {
  try {
    const config = getBaileysConfig();
    const templates = config.templates;

    res.status(200).json({
      status: true,
      message: "Message templates retrieved",
      data: templates,
    });
  } catch (error) {
    console.error("Error in getTemplates:", error);
    res.status(500).json({
      status: false,
      message: "Failed to get templates",
      error: error.message,
    });
  }
};

/**
 * Get specific template
 */
export const getTemplate = async (req, res) => {
  try {
    const { templateName } = req.params;
    const template = getMessageTemplate(templateName);

    if (!template) {
      return res.status(404).json({
        status: false,
        message: `Template '${templateName}' not found`,
      });
    }

    res.status(200).json({
      status: true,
      message: "Template retrieved",
      data: template,
    });
  } catch (error) {
    console.error("Error in getTemplate:", error);
    res.status(500).json({
      status: false,
      message: "Failed to get template",
      error: error.message,
    });
  }
};

/**
 * Format phone number
 */
export const formatPhone = async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        status: false,
        message: "Phone number is required",
      });
    }

    const formatted = formatPhoneNumber(phone);

    res.status(200).json({
      status: true,
      message: "Phone number formatted",
      data: {
        original: phone,
        formatted: formatted,
      },
    });
  } catch (error) {
    console.error("Error in formatPhone:", error);
    res.status(500).json({
      status: false,
      message: "Failed to format phone number",
      error: error.message,
    });
  }
};

/**
 * Preview message template
 */
export const previewTemplate = async (req, res) => {
  try {
    const { templateName } = req.params;
    const { ticketData, reporterName } = req.body;

    const message = buildMessageFromTemplate(templateName, {
      ticketData,
      reporterName: reporterName || "John Doe",
    });

    if (!message) {
      return res.status(404).json({
        status: false,
        message: `Template '${templateName}' not found`,
      });
    }

    res.status(200).json({
      status: true,
      message: "Template preview generated",
      data: {
        templateName,
        message,
        messageLength: message.length,
      },
    });
  } catch (error) {
    console.error("Error in previewTemplate:", error);
    res.status(500).json({
      status: false,
      message: "Failed to preview template",
      error: error.message,
    });
  }
};

/**
 * Update configuration (runtime only)
 */
export const updateConfig = async (req, res) => {
  try {
    const { key, value } = req.body;

    if (!key) {
      return res.status(400).json({
        status: false,
        message: "Configuration key is required",
      });
    }

    const updatedConfig = updateBaileysConfig(key, value);

    res.status(200).json({
      status: true,
      message: "Configuration updated (runtime only)",
      data: updatedConfig,
    });
  } catch (error) {
    console.error("Error in updateConfig:", error);
    res.status(500).json({
      status: false,
      message: "Failed to update configuration",
      error: error.message,
    });
  }
};

/**
 * Get system status
 */
export const getSystemStatus = async (req, res) => {
  try {
    const whatsappConnected = isConnected();
    const notificationEnabled = isNotificationEnabled();
    const config = getBaileysConfig();

    res.status(200).json({
      status: true,
      message: "System status retrieved",
      data: {
        whatsapp: {
          connected: whatsappConnected,
          businessName: config.whatsapp.businessName,
          businessPhone: config.whatsapp.businessPhone,
        },
        notifications: {
          enabled: notificationEnabled,
          autoSendOnTicketCreate: config.notifications.autoSendOnTicketCreate,
          sendToReporter: config.notifications.sendToReporter,
        },
        helpdesk: {
          teamSize: getActiveHelpdeskTeam().length,
        },
        templates: {
          available: Object.keys(config.templates).length,
        },
      },
    });
  } catch (error) {
    console.error("Error in getSystemStatus:", error);
    res.status(500).json({
      status: false,
      message: "Failed to get system status",
      error: error.message,
    });
  }
};

export default {
  getConfig,
  getHelpdeskTeam,
  getNotificationConfig,
  getTemplates,
  getTemplate,
  formatPhone,
  previewTemplate,
  updateConfig,
  getSystemStatus,
};
