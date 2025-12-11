import supabase from "../config/supabase.js";

/**
 * Hardcoded Baileys Configuration
 * Simpan konfigurasi WhatsApp dan nomor-nomor penting di sini
 */
export const BAILEYS_CONFIG = {
  // WhatsApp Business Info
  whatsapp: {
    businessName: "SILADAN Helpdesk",
    businessPhone: "6281234567890", // Nomor WA yang login di Baileys
    description: "Sistem Layanan Aduan - Official Support",
  },

  // Notification Settings
  notifications: {
    enabled: true,
    autoSendOnTicketCreate: true,
    includeTicketDetails: true,
    sendToReporter: true,
    sendToHelpdesk: false,
  },

  // Helpdesk Team Numbers (jika perlu kirim ke team)
  helpdeskTeam: [
    {
      name: "Admin Helpdesk",
      phone: "6281234567890",
      role: "admin",
      active: true,
    },
    {
      name: "Support Team 1",
      phone: "6289876543210",
      role: "support",
      active: true,
    },
  ],

  // Message Templates
  templates: {
    ticketCreated: {
      title: "✅ TIKET ANDA TELAH DITERIMA - SILADAN",
      greeting: (name) => `Halo *${name}*,`,
      body: "Tiket Anda telah berhasil diterima dan akan diproses lebih lanjut oleh tim kami.",
      footer: "_Tiket Anda akan segera ditindaklanjuti. Terima kasih atas kesabaran Anda._\n\nTerima kasih telah menggunakan layanan SILADAN. 🙏",
    },
    ticketAssigned: {
      title: "👤 TIKET ANDA TELAH DITUGASKAN",
      body: "Tiket Anda telah ditugaskan kepada teknisi kami dan sedang dalam proses penanganan.",
    },
    ticketResolved: {
      title: "✅ TIKET ANDA TELAH DISELESAIKAN",
      body: "Tiket Anda telah berhasil diselesaikan. Silakan cek detail resolusi di sistem.",
    },
    ticketClosed: {
      title: "🔒 TIKET DITUTUP",
      body: "Tiket Anda telah ditutup. Terima kasih telah menggunakan layanan SILADAN.",
    },
  },

  // Phone Number Format Rules
  phoneFormat: {
    countryCode: "62",
    removeLeadingZero: true,
    addWhatsAppSuffix: true, // @s.whatsapp.net
  },

  // Test Numbers (untuk development)
  testNumbers: [
    {
      name: "Test User 1",
      phone: "6281357571468",
      description: "Nomor test untuk development",
    },
  ],
};

/**
 * Get Baileys configuration
 */
export const getBaileysConfig = () => {
  return BAILEYS_CONFIG;
};

/**
 * Get active helpdesk team members
 */
export const getActiveHelpdeskTeam = () => {
  return BAILEYS_CONFIG.helpdeskTeam.filter((member) => member.active);
};

/**
 * Get message template
 */
export const getMessageTemplate = (templateName) => {
  return BAILEYS_CONFIG.templates[templateName] || null;
};

/**
 * Format phone number according to config
 */
export const formatPhoneNumber = (phone) => {
  if (!phone) return null;

  let formatted = phone.replace(/[^0-9]/g, ""); // Remove non-numeric

  // Remove leading zero if configured
  if (BAILEYS_CONFIG.phoneFormat.removeLeadingZero && formatted.startsWith("0")) {
    formatted = formatted.substring(1);
  }

  // Add country code if not present
  if (!formatted.startsWith(BAILEYS_CONFIG.phoneFormat.countryCode)) {
    formatted = BAILEYS_CONFIG.phoneFormat.countryCode + formatted;
  }

  // Add WhatsApp suffix if configured
  if (BAILEYS_CONFIG.phoneFormat.addWhatsAppSuffix) {
    formatted = formatted + "@s.whatsapp.net";
  }

  return formatted;
};

/**
 * Build message from template
 */
export const buildMessageFromTemplate = (templateName, data) => {
  const template = getMessageTemplate(templateName);
  if (!template) return null;

  const { ticketData, reporterName } = data;

  let message = `${template.title}\n\n`;
  
  if (template.greeting) {
    message += `${template.greeting(reporterName || "Pengguna")}\n\n`;
  }
  
  message += `${template.body}\n\n`;
  message += `━━━━━━━━━━━━━━━━━━━━\n`;
  
  if (ticketData) {
    message += `🔖 *Nomor Tiket:* ${ticketData.ticket_number || "N/A"}\n`;
    message += `📝 *Judul:* ${ticketData.title || "N/A"}\n`;
    message += `🏷️ *Tipe:* ${ticketData.type === "incident" ? "Insiden" : "Permintaan"}\n`;
    message += `📋 *Kategori:* ${ticketData.category || "Umum"}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    message += `📍 *Lokasi:* ${ticketData.incident_location || "N/A"}\n`;
    message += `⚡ *Prioritas:* ${ticketData.priority ? ticketData.priority.toUpperCase() : "LOW"}\n`;
    message += `📊 *Status:* ${ticketData.status || "open"}\n`;
    message += `━━━━━━━━━━━━━━━━━━━━\n`;
    
    if (ticketData.description) {
      message += `📝 *Deskripsi:*\n${ticketData.description}\n\n`;
    }
    
    if (ticketData.created_at) {
      message += `📅 *Dibuat pada:* ${new Date(ticketData.created_at).toLocaleString("id-ID")}\n\n`;
    }
  }
  
  if (template.footer) {
    message += `${template.footer}`;
  }

  return message;
};

/**
 * Get notification settings
 */
export const getNotificationSettings = () => {
  return BAILEYS_CONFIG.notifications;
};

/**
 * Check if notifications are enabled
 */
export const isNotificationEnabled = () => {
  return BAILEYS_CONFIG.notifications.enabled;
};

/**
 * Update configuration (runtime only, not persistent)
 */
export const updateBaileysConfig = (key, value) => {
  const keys = key.split(".");
  let obj = BAILEYS_CONFIG;
  
  for (let i = 0; i < keys.length - 1; i++) {
    obj = obj[keys[i]];
  }
  
  obj[keys[keys.length - 1]] = value;
  return BAILEYS_CONFIG;
};

export default {
  BAILEYS_CONFIG,
  getBaileysConfig,
  getActiveHelpdeskTeam,
  getMessageTemplate,
  formatPhoneNumber,
  buildMessageFromTemplate,
  getNotificationSettings,
  isNotificationEnabled,
  updateBaileysConfig,
};
