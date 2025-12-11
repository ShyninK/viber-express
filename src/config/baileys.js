import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import qrcode from "qrcode-terminal";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create auth directory if it doesn't exist
const authDir = path.join(__dirname, "../../auth_info_baileys");
if (!fs.existsSync(authDir)) {
  fs.mkdirSync(authDir, { recursive: true });
}

let sock = null;
let qrDinamic = null;

// Pino logger configuration (silent mode untuk production)
const logger = pino({
  level: process.env.LOG_LEVEL || "silent",
});

/**
 * Connect to WhatsApp using Baileys
 */
export const connectToWhatsApp = async () => {
  const { state, saveCreds } = await useMultiFileAuthState(authDir);
  const { version, isLatest } = await fetchLatestBaileysVersion();
  console.log(`using WA v${version.join(".")}, isLatest: ${isLatest}`);

  sock = makeWASocket({
    version,
    logger,
    printQRInTerminal: false,
    auth: state,
    // browser: ["SILADAN Helpdesk", "Chrome", "1.0.0"], // Coba comment ini
    defaultQueryTimeoutMs: undefined,
    syncFullHistory: false,
    connectTimeoutMs: 60000,
  });

  // Connection update handler
  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrDinamic = qr;
      console.log("\n📱 QR Code generated! Scan sekarang:");
      qrcode.generate(qr, { small: true });
    }

    // Connection established
    if (connection === "open") {
      console.log("✅ WhatsApp connected successfully!");
      qrDinamic = null;
    }

    // Connection closed
    if (connection === "close") {
      const shouldReconnect =
        (lastDisconnect?.error instanceof Boom)
          ? lastDisconnect.error.output.statusCode !== DisconnectReason.loggedOut
          : true;

      console.log(
        "⚠️ Connection closed due to:",
        lastDisconnect?.error?.message || "Unknown reason"
      );
      console.log("Full error:", lastDisconnect?.error);

      if (shouldReconnect) {
        console.log("🔄 Reconnecting in 3 seconds...");
        setTimeout(() => connectToWhatsApp(), 3000);
      } else {
        console.log("❌ Logged out. Please delete auth folder and restart to scan QR again.");
        sock = null;
      }
    }
  });

  // Save credentials on update
  sock.ev.on("creds.update", saveCreds);

  // Messages handler (optional - untuk receive messages)
  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;
    
    const msg = messages[0];
    if (!msg.message) return;

    // Log incoming messages
    const from = msg.key.remoteJid;
    const messageText = 
      msg.message.conversation || 
      msg.message.extendedTextMessage?.text || 
      "";
    
    console.log(`📨 Message from ${from}: ${messageText}`);
  });

  return sock;
};

/**
 * Get current WhatsApp socket instance
 */
export const getWASocket = () => {
  return sock;
};

/**
 * Get current QR code
 */
export const getQR = () => {
  return qrDinamic;
};

/**
 * Check if WhatsApp is connected
 */
export const isConnected = () => {
  return sock?.user ? true : false;
};

/**
 * Send WhatsApp message
 * @param {string} to - Phone number with country code (e.g., "6281234567890")
 * @param {string} message - Message text
 */
export const sendWhatsAppMessage = async (to, message) => {
  try {
    console.log("📲 [Baileys] sendWhatsAppMessage called");
    console.log("📲 [Baileys] to:", to);
    console.log("📲 [Baileys] message length:", message.length);
    
    if (!sock || !sock.user) {
      console.error("❌ [Baileys] Socket not connected or user not authenticated");
      throw new Error("WhatsApp not connected. Please scan QR code first.");
    }

    console.log("✅ [Baileys] Socket connected, user:", sock.user.id);

    // Format phone number properly
    let formattedNumber = to.replace(/[^0-9]/g, ''); // Remove non-numeric
    
    // Add 62 prefix if starts with 0
    if (formattedNumber.startsWith('0')) {
      formattedNumber = '62' + formattedNumber.substring(1);
    } else if (!formattedNumber.startsWith('62')) {
      formattedNumber = '62' + formattedNumber;
    }
    
    // Add @s.whatsapp.net suffix
    const jid = formattedNumber + '@s.whatsapp.net';
    console.log("📲 [Baileys] Formatted JID:", jid);

    // Send message
    console.log("📤 [Baileys] Sending message via sock.sendMessage...");
    const result = await sock.sendMessage(jid, {
      text: message,
    });

    console.log(`✅ [Baileys] WhatsApp message sent successfully to ${to}`);
    console.log("✅ [Baileys] Message ID:", result?.key?.id);
    return {
      success: true,
      messageId: result.key.id,
      to: jid,
    };
  } catch (error) {
    console.error("❌ [Baileys] Error sending WhatsApp message:");
    console.error("❌ [Baileys] Error name:", error.name);
    console.error("❌ [Baileys] Error message:", error.message);
    console.error("❌ [Baileys] Full error:", error);
    throw error;
  }
};

/**
 * Send WhatsApp message with media (image, document, etc.)
 * @param {string} to - Phone number
 * @param {object} mediaOptions - { image/document/video: buffer, caption: "text" }
 */
export const sendWhatsAppMedia = async (to, mediaOptions) => {
  try {
    if (!sock || !sock.user) {
      throw new Error("WhatsApp not connected. Please scan QR code first.");
    }

    const jid = to.includes("@s.whatsapp.net") ? to : `${to}@s.whatsapp.net`;
    const result = await sock.sendMessage(jid, mediaOptions);

    console.log(`✅ WhatsApp media sent to ${to}`);
    return {
      success: true,
      messageId: result.key.id,
      to: jid,
    };
  } catch (error) {
    console.error("❌ Error sending WhatsApp media:", error);
    throw error;
  }
};

/**
 * Logout from WhatsApp
 */
export const logoutWhatsApp = async () => {
  try {
    if (sock) {
      await sock.logout();
      console.log("✅ WhatsApp logged out successfully");
      
      // Remove auth files
      if (fs.existsSync(authDir)) {
        fs.rmSync(authDir, { recursive: true, force: true });
      }
      
      sock = null;
      qrDinamic = null;
    }
  } catch (error) {
    console.error("❌ Error logging out from WhatsApp:", error);
    throw error;
  }
};

export default {
  connectToWhatsApp,
  getWASocket,
  getQR,
  isConnected,
  sendWhatsAppMessage,
  sendWhatsAppMedia,
  logoutWhatsApp,
};
