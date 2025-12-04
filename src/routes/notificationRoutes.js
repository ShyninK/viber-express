import express from "express";
import * as notifController from "../controllers/notificationController.js";
// import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

// All routes require authentication
router.get("/", /* authenticate, */ notifController.index); // GET /api/v1/notifications
router.get("/unread", /* authenticate, */ notifController.getUnread); // GET /api/v1/notifications/unread
router.get("/unread/count", /* authenticate, */ notifController.getUnreadCount); // GET /api/v1/notifications/unread/count
router.patch("/:id/read", /* authenticate, */ notifController.markAsRead); // PATCH /api/v1/notifications/:id/read
router.patch("/read-all", /* authenticate, */ notifController.markAllAsRead); // PATCH /api/v1/notifications/read-all
router.delete("/:id", /* authenticate, */ notifController.deleteNotification); // DELETE /api/v1/notifications/:id
router.delete("/read/clear", /* authenticate, */ notifController.deleteReadNotifications); // DELETE /api/v1/notifications/read/clear

export default router;
