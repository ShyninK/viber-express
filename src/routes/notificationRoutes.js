import express from "express";
import {
  getUserNotifications,
  getNotificationsByType,
  getUnreadNotificationsCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  removeNotification,
  getNotification,
  getTicketNotifications,
  whatsappConnect,
  getWhatsAppQR,
  getWhatsAppStatus,
  whatsappLogout,
  testSendWhatsApp,
  testTicketNotification,
} from "../controllers/notificationController.js";

const router = express.Router();

// ====== WhatsApp Management (HARUS DI ATAS!) ======
/**
 * @route   POST /api/v1/notifications/whatsapp/connect
 * @desc    Manually connect to WhatsApp (trigger connection)
 * @access  Public
 */
router.post("/whatsapp/connect", whatsappConnect);

/**
 * @route   GET /api/v1/notifications/whatsapp/qr
 * @desc    Get WhatsApp QR code for authentication
 * @access  Public
 */
router.get("/whatsapp/qr", getWhatsAppQR);

/**
 * @route   GET /api/v1/notifications/whatsapp/status
 * @desc    Check WhatsApp connection status
 * @access  Public
 */
router.get("/whatsapp/status", getWhatsAppStatus);

/**
 * @route   POST /api/v1/notifications/whatsapp/logout
 * @desc    Logout from WhatsApp
 * @access  Private
 */
router.post("/whatsapp/logout", whatsappLogout);

/**
 * @route   POST /api/v1/notifications/whatsapp/test
 * @desc    Test send WhatsApp message
 * @access  Private
 */
router.post("/whatsapp/test", testSendWhatsApp);

/**
 * @route   POST /api/v1/notifications/tickets/:ticketId/test
 * @desc    Test ticket notification manually
 * @access  Private
 */
router.post("/tickets/:ticketId/test", testTicketNotification);

// ====== Notification Management ======
/**
 * @route   GET /api/v1/notifications/users/:userId
 * @desc    Get all notifications for a user
 * @access  Private
 */
router.get("/users/:userId", getUserNotifications);

/**
 * @route   GET /api/v1/notifications/users/:userId/type/:type
 * @desc    Get notifications by type (info, warning, error, success)
 * @access  Private
 */
router.get("/users/:userId/type/:type", getNotificationsByType);

/**
 * @route   GET /api/v1/notifications/users/:userId/unread
 * @desc    Get unread notifications count for a user
 * @access  Private
 */
router.get("/users/:userId/unread", getUnreadNotificationsCount);

/**
 * @route   GET /api/v1/notifications/:notificationId
 * @desc    Get notification by ID
 * @access  Private
 */
router.get("/:notificationId", getNotification);

/**
 * @route   GET /api/v1/notifications/tickets/:ticketId
 * @desc    Get all notifications for a specific ticket
 * @access  Private
 */
router.get("/tickets/:ticketId", getTicketNotifications);

/**
 * @route   PUT /api/v1/notifications/:notificationId/read
 * @desc    Mark notification as read
 * @access  Private
 */
router.put("/:notificationId/read", markNotificationAsRead);

/**
 * @route   PUT /api/v1/notifications/users/:userId/read-all
 * @desc    Mark all notifications as read for a user
 * @access  Private
 */
router.put("/users/:userId/read-all", markAllNotificationsAsRead);

/**
 * @route   DELETE /api/v1/notifications/:notificationId
 * @desc    Delete notification
 * @access  Private
 */
router.delete("/:notificationId", removeNotification);

export default router;
