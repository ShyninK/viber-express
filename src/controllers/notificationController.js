import * as notificationsModel from "../models/notificationsModel.js";

// Get all notifications for logged-in user
export const index = async (req, res) => {
  try {
    // Untuk sementara menggunakan query parameter user_id
    // Nanti bisa diganti dengan req.user.id dari middleware authentication
    const userId = req.query.user_id;

    if (!userId) {
      return res.status(400).json({
        status: false,
        message: "user_id query parameter is required",
      });
    }

    const notifications = await notificationsModel.getNotificationsByUserId(userId);
    res.status(200).json({
      status: true,
      message: "Notifications retrieved successfully",
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// Get unread notifications
export const getUnread = async (req, res) => {
  try {
    const userId = req.query.user_id;

    if (!userId) {
      return res.status(400).json({
        status: false,
        message: "user_id query parameter is required",
      });
    }

    const notifications = await notificationsModel.getUnreadNotifications(userId);
    res.status(200).json({
      status: true,
      message: "Unread notifications retrieved successfully",
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// Get unread notification count
export const getUnreadCount = async (req, res) => {
  try {
    const userId = req.query.user_id;

    if (!userId) {
      return res.status(400).json({
        status: false,
        message: "user_id query parameter is required",
      });
    }

    const count = await notificationsModel.getUnreadCount(userId);
    res.status(200).json({
      status: true,
      message: "Unread notification count retrieved successfully",
      data: { count },
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// Mark notification as read
export const markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await notificationsModel.markAsRead(id);
    res.status(200).json({
      status: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// Mark all notifications as read
export const markAllAsRead = async (req, res) => {
  try {
    const userId = req.query.user_id;

    if (!userId) {
      return res.status(400).json({
        status: false,
        message: "user_id query parameter is required",
      });
    }

    const notifications = await notificationsModel.markAllAsRead(userId);
    res.status(200).json({
      status: true,
      message: "All notifications marked as read",
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// Delete notification
export const deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const notification = await notificationsModel.deleteNotification(id);
    res.status(200).json({
      status: true,
      message: "Notification deleted successfully",
      data: notification,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};

// Delete all read notifications
export const deleteReadNotifications = async (req, res) => {
  try {
    const userId = req.query.user_id;

    if (!userId) {
      return res.status(400).json({
        status: false,
        message: "user_id query parameter is required",
      });
    }

    const notifications = await notificationsModel.deleteReadNotifications(userId);
    res.status(200).json({
      status: true,
      message: "Read notifications deleted successfully",
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({
      status: false,
      message: error.message,
    });
  }
};
