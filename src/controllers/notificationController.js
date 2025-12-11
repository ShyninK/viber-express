import {
  createNotification,
  getNotificationsByUserId,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  getNotificationById,
  getNotificationsByTicketId,
  getHelpdeskUsers,
  getUserById,
} from "../models/notificationsModel.js";
import {
  sendWhatsAppMessage,
  getQR,
  isConnected,
  logoutWhatsApp,
  connectToWhatsApp,
} from "../config/baileys.js";
import supabase from "../config/supabase.js";

/**
 * Send notification to ticket reporter via WhatsApp when new ticket is created
 */
export const sendTicketNotificationToHelpdesk = async (ticketData) => {
  try {
    console.log("📨 Processing ticket notification for ticket:", ticketData.id);
    console.log("📋 Ticket data:", JSON.stringify(ticketData, null, 2));
    
    // Check if WhatsApp is connected
    if (!isConnected()) {
      console.log("⚠️ WhatsApp not connected. Skipping notification.");
      return { success: false, message: "WhatsApp not connected" };
    }
    console.log("✅ WhatsApp is connected");

    const results = [];

    // Send notification to the ticket reporter
    try {
      let reporterPhone = ticketData.reporter_phone;
      let reporterName = ticketData.reporter_name || "Pengguna";

      console.log("👤 Reporter data from ticket - Phone:", reporterPhone, "Name:", reporterName);

      // Check if we have a phone number
      if (!reporterPhone) {
        console.log("❌ No reporter_phone found in ticket data");
        return { 
          success: false, 
          message: "No reporter_phone found in ticket",
          ticketId: ticketData.id
        };
      }

      // Format phone number: remove non-numeric, convert 08 to 62
      let formattedPhone = reporterPhone.replace(/[^0-9]/g, ''); // Remove non-numeric
      
      if (formattedPhone.startsWith('08')) {
        formattedPhone = '62' + formattedPhone.substring(1); // Replace 08 with 62
      } else if (formattedPhone.startsWith('0')) {
        formattedPhone = '62' + formattedPhone.substring(1); // Replace 0 with 62
      } else if (!formattedPhone.startsWith('62')) {
        formattedPhone = '62' + formattedPhone; // Add 62 prefix if not exists
      }
      
      console.log("📞 Phone formatted from", reporterPhone, "to", formattedPhone);
      console.log("📍 Phone source: reporter_phone (from tickets table)");

      // Prepare WhatsApp message
      const waMessage = `✅ *TIKET ANDA TELAH DITERIMA - SILADAN*\n\n` +
        `Halo *${reporterName}*,\n\n` +
        `Tiket Anda telah berhasil diterima dan akan diproses lebih lanjut oleh tim kami.\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `🔖 *Nomor Tiket:* ${ticketData.ticket_number}\n` +
        `📝 *Judul:* ${ticketData.title}\n` +
        `🏷️ *Tipe:* ${ticketData.type === 'incident' ? 'Insiden' : 'Permintaan'}\n` +
        `📋 *Kategori:* ${ticketData.category || "Umum"}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📍 *Lokasi:* ${ticketData.incident_location || "N/A"}\n` +
        `⚡ *Prioritas:* ${ticketData.priority ? ticketData.priority.toUpperCase() : "LOW"}\n` +
        `📊 *Status:* ${ticketData.status || "open"}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `📝 *Deskripsi:*\n${ticketData.description || "Tidak ada deskripsi"}\n\n` +
        `📅 *Dibuat pada:* ${new Date(ticketData.created_at || new Date()).toLocaleString("id-ID")}\n\n` +
        `_Tiket Anda akan segera ditindaklanjuti. Terima kasih atas kesabaran Anda._\n\n` +
        `Terima kasih telah menggunakan layanan SILADAN. 🙏`;

      // Send WhatsApp notification first
      console.log("📤 Attempting to send WhatsApp message to:", formattedPhone);
      const waResult = await sendWhatsAppMessage(formattedPhone, waMessage);
      console.log("✅ WhatsApp send result:", waResult);

      // Save notification to database AFTER WhatsApp sent successfully
      let notificationId = null;
      try {
        const notification = await createNotification({
          user_id: ticketData.reporter_id || null,
          title: "✅ Tiket Anda Telah Diterima",
          message: waMessage, // Save full WhatsApp message
          type: "success",
          related_ticket_id: ticketData.id,
          is_read: false,
          phone_number: formattedPhone,
          wa_message_id: waResult.messageId || null,
          wa_sent_at: new Date().toISOString(),
        });
        notificationId = notification.id;
        console.log("✅ Notification saved to database:", notificationId);
      } catch (notifDbError) {
        console.warn("⚠️ Failed to save notification to database:", notifDbError.message);
      }

      results.push({
        recipient: "reporter",
        phone: formattedPhone,
        originalPhone: reporterPhone,
        name: reporterName,
        source: "reporter_phone",
        notificationId: notificationId,
        notificationSavedToDb: notificationId ? true : false,
        whatsappSent: true,
        whatsappMessageId: waResult.messageId,
      });

      console.log(`✅ Notification sent to reporter: ${reporterName} (${formattedPhone})`);

    } catch (error) {
      console.error(`❌ Error sending notification to reporter:`, error);
      results.push({
        recipient: "reporter",
        error: error.message,
      });
    }

    return {
      success: results.some(r => r.whatsappSent),
      message: "Notification processed",
      ticketNumber: ticketData.ticket_number,
      results,
    };
  } catch (error) {
    console.error("Error in sendTicketNotificationToHelpdesk:", error);
    throw error;
  }
};

/**
 * Send notification to reporter when ticket is assigned to technician
 */
export const sendTicketAssignedNotification = async (ticketData) => {
  try {
    console.log("📨 Processing ticket assignment notification for ticket:", ticketData.id);
    console.log("📋 Assigned to technician:", ticketData.assigned_to);
    
    // Check if WhatsApp is connected
    if (!isConnected()) {
      console.log("⚠️ WhatsApp not connected. Skipping notification.");
      return { success: false, message: "WhatsApp not connected" };
    }
    console.log("✅ WhatsApp is connected");

    const results = [];

    // Send notification to the ticket reporter
    try {
      let reporterPhone = ticketData.reporter_phone;
      let reporterName = ticketData.reporter_name || "Pengguna";

      console.log("👤 Reporter data from ticket - Phone:", reporterPhone, "Name:", reporterName);

      // Check if we have a phone number
      if (!reporterPhone) {
        console.log("❌ No reporter_phone found in ticket data");
        return { 
          success: false, 
          message: "No reporter_phone found in ticket",
          ticketId: ticketData.id
        };
      }

      // Format phone number: remove non-numeric, convert 08 to 62
      let formattedPhone = reporterPhone.replace(/[^0-9]/g, '');
      
      if (formattedPhone.startsWith('08')) {
        formattedPhone = '62' + formattedPhone.substring(1);
      } else if (formattedPhone.startsWith('0')) {
        formattedPhone = '62' + formattedPhone.substring(1);
      } else if (!formattedPhone.startsWith('62')) {
        formattedPhone = '62' + formattedPhone;
      }
      
      console.log("📞 Phone formatted from", reporterPhone, "to", formattedPhone);

      // Prepare WhatsApp message for reporter
      const waMessage = `👤 *TIKET DITUGASKAN KE TEKNISI - SILADAN*\n\n` +
        `Halo *${reporterName}*,\n\n` +
        `Kabar baik! Tiket Anda telah ditugaskan kepada teknisi kami dan sedang dalam proses penanganan.\n\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `🔖 *Nomor Tiket:* ${ticketData.ticket_number}\n` +
        `📝 *Judul:* ${ticketData.title}\n` +
        `🏷️ *Tipe:* ${ticketData.type === 'incident' ? 'Insiden' : 'Permintaan'}\n` +
        `📋 *Kategori:* ${ticketData.category || "Umum"}\n` +
        `━━━━━━━━━━━━━━━━━━━━\n` +
        `⚡ *Prioritas:* ${ticketData.priority ? ticketData.priority.toUpperCase() : "LOW"}\n` +
        `📊 *Status:* ${ticketData.status || "assigned"}\n` +
        `👨‍🔧 *Ditugaskan ke:* Teknisi ID ${ticketData.assigned_to}\n` +
        `📅 *Ditugaskan pada:* ${new Date(ticketData.assigned_at || new Date()).toLocaleString("id-ID")}\n\n` +
        `_Teknisi kami akan segera menghubungi Anda untuk proses penanganan._\n\n` +
        `Terima kasih atas kesabaran Anda. 🙏`;

      // Send WhatsApp notification first
      console.log("📤 Attempting to send WhatsApp assignment notification to:", formattedPhone);
      const waResult = await sendWhatsAppMessage(formattedPhone, waMessage);
      console.log("✅ WhatsApp send result:", waResult);

      // Save notification to database AFTER WhatsApp sent successfully
      let notificationId = null;
      try {
        const notification = await createNotification({
          user_id: ticketData.reporter_id || null,
          title: "👤 Tiket Anda Telah Ditugaskan",
          message: waMessage, // Save full WhatsApp message
          type: "info",
          related_ticket_id: ticketData.id,
          is_read: false,
          phone_number: formattedPhone,
          wa_message_id: waResult.messageId || null,
          wa_sent_at: new Date().toISOString(),
        });
        notificationId = notification.id;
        console.log("✅ Notification saved to database:", notificationId);
      } catch (notifDbError) {
        console.warn("⚠️ Failed to save notification to database:", notifDbError.message);
      }

      results.push({
        recipient: "reporter",
        phone: formattedPhone,
        originalPhone: reporterPhone,
        name: reporterName,
        notificationId: notificationId,
        notificationSavedToDb: notificationId ? true : false,
        whatsappSent: true,
        whatsappMessageId: waResult.messageId,
      });

      console.log(`✅ Assignment notification sent to reporter: ${reporterName} (${formattedPhone})`);

    } catch (error) {
      console.error(`❌ Error sending assignment notification to reporter:`, error);
      results.push({
        recipient: "reporter",
        error: error.message,
      });
    }

    // Send notification to the assigned technician
    try {
      console.log("👨‍🔧 Fetching technician data for ID:", ticketData.assigned_to);
      
      const { data: technician, error: techError } = await supabase
        .from("users")
        .select("id, name, email, phone")
        .eq("id", ticketData.assigned_to)
        .single();

      if (techError || !technician) {
        console.error("❌ Failed to fetch technician data:", techError?.message);
        results.push({
          recipient: "technician",
          error: "Technician not found",
        });
      } else {
        console.log("✅ Technician data retrieved:", technician.name, technician.phone);

        if (!technician.phone) {
          console.log("❌ No phone number found for technician");
          results.push({
            recipient: "technician",
            error: "No phone number found",
          });
        } else {
          // Format technician phone number
          let techPhone = technician.phone.replace(/[^0-9]/g, '');
          
          if (techPhone.startsWith('08')) {
            techPhone = '62' + techPhone.substring(1);
          } else if (techPhone.startsWith('0')) {
            techPhone = '62' + techPhone.substring(1);
          } else if (!techPhone.startsWith('62')) {
            techPhone = '62' + techPhone;
          }
          
          console.log("📞 Technician phone formatted from", technician.phone, "to", techPhone);

          // Prepare WhatsApp message for technician
          const techWaMessage = `🔔 *TIKET BARU DITUGASKAN - SILADAN*\n\n` +
            `Halo *${technician.name}*,\n\n` +
            `Anda mendapat tiket baru yang perlu ditangani.\n\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `🔖 *Nomor Tiket:* ${ticketData.ticket_number}\n` +
            `📝 *Judul:* ${ticketData.title}\n` +
            `🏷️ *Tipe:* ${ticketData.type === 'incident' ? 'Insiden' : 'Permintaan'}\n` +
            `📋 *Kategori:* ${ticketData.category || "Umum"}\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `⚡ *Prioritas:* ${ticketData.priority ? ticketData.priority.toUpperCase() : "LOW"}\n` +
            `👤 *Pelapor:* ${ticketData.reporter_name || "Pengguna"}\n` +
            `📱 *Kontak:* ${ticketData.reporter_phone || "-"}\n` +
            `📅 *Ditugaskan pada:* ${new Date(ticketData.assigned_at || new Date()).toLocaleString("id-ID")}\n\n` +
            `📋 *Deskripsi:*\n${ticketData.description || "Tidak ada deskripsi"}\n\n` +
            `_Silakan segera proses tiket ini. Terima kasih!_ 🙏`;

          // Send WhatsApp notification first
          console.log("📤 Attempting to send WhatsApp notification to technician:", techPhone);
          const techWaResult = await sendWhatsAppMessage(techPhone, techWaMessage);
          console.log("✅ WhatsApp send result to technician:", techWaResult);

          // Save notification to database AFTER WhatsApp sent successfully
          let techNotificationId = null;
          try {
            const techNotification = await createNotification({
              user_id: technician.id,
              title: "🔔 Tiket Baru Ditugaskan",
              message: techWaMessage, // Save full WhatsApp message
              type: "info",
              related_ticket_id: ticketData.id,
              is_read: false,
              phone_number: techPhone,
              wa_message_id: techWaResult.messageId || null,
              wa_sent_at: new Date().toISOString(),
            });
            techNotificationId = techNotification.id;
            console.log("✅ Technician notification saved to database:", techNotificationId);
          } catch (notifDbError) {
            console.warn("⚠️ Failed to save technician notification to database:", notifDbError.message);
          }

          results.push({
            recipient: "technician",
            phone: techPhone,
            originalPhone: technician.phone,
            name: technician.name,
            userId: technician.id,
            notificationId: techNotificationId,
            notificationSavedToDb: techNotificationId ? true : false,
            whatsappSent: true,
            whatsappMessageId: techWaResult.messageId,
          });

          console.log(`✅ Assignment notification sent to technician: ${technician.name} (${techPhone})`);
        }
      }

    } catch (error) {
      console.error(`❌ Error sending assignment notification to technician:`, error);
      results.push({
        recipient: "technician",
        error: error.message,
      });
    }

    return {
      success: results.some(r => r.whatsappSent),
      message: "Assignment notifications processed",
      ticketNumber: ticketData.ticket_number,
      results,
    };
  } catch (error) {
    console.error("Error in sendTicketAssignedNotification:", error);
    throw error;
  }
};

/**
 * Get all notifications for a user
 */
export const getUserNotifications = async (req, res) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    const notifications = await getNotificationsByUserId(userId, limit);

    res.status(200).json({
      status: true,
      message: "Notifications retrieved successfully",
      data: notifications,
    });
  } catch (error) {
    console.error("Error in getUserNotifications:", error);
    res.status(500).json({
      status: false,
      message: "Failed to retrieve notifications",
      error: error.message,
    });
  }
};

/**
 * Get notifications by type (info, warning, error, success)
 */
export const getNotificationsByType = async (req, res) => {
  try {
    const { userId, type } = req.params;
    const limit = parseInt(req.query.limit) || 50;

    // Validate type
    const validTypes = ['info', 'warning', 'error', 'success'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        status: false,
        message: `Invalid type. Must be one of: ${validTypes.join(', ')}`,
      });
    }

    const { getNotificationsByType: getByType } = await import("../models/notificationsModel.js");
    const notifications = await getByType(userId, type, limit);

    res.status(200).json({
      status: true,
      message: `Notifications of type '${type}' retrieved successfully`,
      data: notifications,
    });
  } catch (error) {
    console.error("Error in getNotificationsByType:", error);
    res.status(500).json({
      status: false,
      message: "Failed to retrieve notifications by type",
      error: error.message,
    });
  }
};

/**
 * Get unread notifications count
 */
export const getUnreadNotificationsCount = async (req, res) => {
  try {
    const { userId } = req.params;
    const count = await getUnreadCount(userId);

    res.status(200).json({
      status: true,
      message: "Unread count retrieved successfully",
      data: { count },
    });
  } catch (error) {
    console.error("Error in getUnreadNotificationsCount:", error);
    res.status(500).json({
      status: false,
      message: "Failed to retrieve unread count",
      error: error.message,
    });
  }
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = await markAsRead(notificationId);

    res.status(200).json({
      status: true,
      message: "Notification marked as read",
      data: notification,
    });
  } catch (error) {
    console.error("Error in markNotificationAsRead:", error);
    res.status(500).json({
      status: false,
      message: "Failed to mark notification as read",
      error: error.message,
    });
  }
};

/**
 * Mark all notifications as read
 */
export const markAllNotificationsAsRead = async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await markAllAsRead(userId);

    res.status(200).json({
      status: true,
      message: "All notifications marked as read",
      data: notifications,
    });
  } catch (error) {
    console.error("Error in markAllNotificationsAsRead:", error);
    res.status(500).json({
      status: false,
      message: "Failed to mark all notifications as read",
      error: error.message,
    });
  }
};

/**
 * Delete notification
 */
export const removeNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    await deleteNotification(notificationId);

    res.status(200).json({
      status: true,
      message: "Notification deleted successfully",
    });
  } catch (error) {
    console.error("Error in removeNotification:", error);
    res.status(500).json({
      status: false,
      message: "Failed to delete notification",
      error: error.message,
    });
  }
};

/**
 * Get notification by ID
 */
export const getNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const notification = await getNotificationById(notificationId);

    res.status(200).json({
      status: true,
      message: "Notification retrieved successfully",
      data: notification,
    });
  } catch (error) {
    console.error("Error in getNotification:", error);
    res.status(500).json({
      status: false,
      message: "Failed to retrieve notification",
      error: error.message,
    });
  }
};

/**
 * Get notifications by ticket ID
 */
export const getTicketNotifications = async (req, res) => {
  try {
    const { ticketId } = req.params;
    const notifications = await getNotificationsByTicketId(ticketId);

    res.status(200).json({
      status: true,
      message: "Ticket notifications retrieved successfully",
      data: notifications,
    });
  } catch (error) {
    console.error("Error in getTicketNotifications:", error);
    res.status(500).json({
      status: false,
      message: "Failed to retrieve ticket notifications",
      error: error.message,
    });
  }
};

/**
 * Manually connect to WhatsApp
 */
export const whatsappConnect = async (req, res) => {
  try {
    await connectToWhatsApp();
    
    res.status(200).json({
      status: true,
      message: "WhatsApp connection initiated. Check terminal for QR or call /whatsapp/qr endpoint",
    });
  } catch (error) {
    console.error("Error in whatsappConnect:", error);
    res.status(500).json({
      status: false,
      message: "Failed to initiate WhatsApp connection",
      error: error.message,
    });
  }
};

/**
 * Get WhatsApp QR code for authentication
 */
export const getWhatsAppQR = async (req, res) => {
  try {
    const qr = getQR();

    if (!qr) {
      return res.status(200).json({
        status: false,
        message: isConnected()
          ? "WhatsApp already connected"
          : "QR code not available yet. Please wait...",
        connected: isConnected(),
      });
    }

    // Return QR as image (you can also return as base64)
    res.status(200).json({
      status: true,
      message: "QR code generated",
      qr: qr,
      connected: false,
    });
  } catch (error) {
    console.error("Error in getWhatsAppQR:", error);
    res.status(500).json({
      status: false,
      message: "Failed to get QR code",
      error: error.message,
    });
  }
};

/**
 * Check WhatsApp connection status
 */
export const getWhatsAppStatus = async (req, res) => {
  try {
    const connected = isConnected();

    res.status(200).json({
      status: true,
      message: connected ? "WhatsApp connected" : "WhatsApp not connected",
      connected,
    });
  } catch (error) {
    console.error("Error in getWhatsAppStatus:", error);
    res.status(500).json({
      status: false,
      message: "Failed to check WhatsApp status",
      error: error.message,
    });
  }
};

/**
 * Logout from WhatsApp
 */
export const whatsappLogout = async (req, res) => {
  try {
    await logoutWhatsApp();

    res.status(200).json({
      status: true,
      message: "WhatsApp logged out successfully",
    });
  } catch (error) {
    console.error("Error in whatsappLogout:", error);
    res.status(500).json({
      status: false,
      message: "Failed to logout from WhatsApp",
      error: error.message,
    });
  }
};

/**
 * Test send WhatsApp notification (for testing purposes)
 */
export const testSendWhatsApp = async (req, res) => {
  try {
    let { phoneNumber, message, userId } = req.body;

    if ((!phoneNumber && !userId) || !message) {
      return res.status(400).json({
        status: false,
        message: "Phone number (or userId) and message are required",
      });
    }

    // If userId is provided, fetch phone number from database
    if (userId && !phoneNumber) {
      const user = await getUserById(userId);
      if (!user) {
        return res.status(404).json({
          status: false,
          message: "User not found",
        });
      }
      
      if (!user.phone) {
        return res.status(400).json({
          status: false,
          message: "User does not have a phone number",
        });
      }
      
      phoneNumber = user.phone;
    }

    if (!isConnected()) {
      return res.status(400).json({
        status: false,
        message: "WhatsApp not connected. Please scan QR code first.",
      });
    }

    const result = await sendWhatsAppMessage(phoneNumber, message);

    res.status(200).json({
      status: true,
      message: "WhatsApp message sent successfully",
      data: result,
    });
  } catch (error) {
    console.error("Error in testSendWhatsApp:", error);
    res.status(500).json({
      status: false,
      message: "Failed to send WhatsApp message",
      error: error.message,
    });
  }
};

/**
 * Test ticket notification manually by ticket ID
 */
export const testTicketNotification = async (req, res) => {
  try {
    const { ticketId } = req.params;
    
    if (!ticketId) {
      return res.status(400).json({
        status: false,
        message: "ticketId is required",
      });
    }

    // Fetch ticket data from database
    const { data: ticket, error } = await supabase
      .from('tickets')
      .select('*')
      .eq('id', ticketId)
      .single();

    if (error || !ticket) {
      return res.status(404).json({
        status: false,
        message: "Ticket not found",
        error: error?.message,
      });
    }

    console.log("🧪 Manual test ticket notification for ticket:", ticketId);
    
    // Send notification
    const result = await sendTicketNotificationToHelpdesk(ticket);

    res.status(200).json({
      status: result.success,
      message: "Test notification completed",
      data: result,
    });
  } catch (error) {
    console.error("Error in testTicketNotification:", error);
    res.status(500).json({
      status: false,
      message: "Failed to test notification",
      error: error.message,
    });
  }
};

export default {
  sendTicketNotificationToHelpdesk,
  sendTicketAssignedNotification,
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
};
