import express from "express";
import * as chatController from "../controllers/chatController.js";

const router = express.Router();

// ==========================================
// Chat Room routes (Direct Messaging)
// ==========================================
router.get("/rooms", chatController.getRooms); // GET /api/v1/chat/rooms
router.get("/rooms/:roomId", chatController.getRoomById); // GET /api/v1/chat/rooms/:roomId
router.post("/rooms", chatController.createRoom); // POST /api/v1/chat/rooms

// Messages routes
router.get("/rooms/:roomId/messages", chatController.getMessages); // GET /api/v1/chat/rooms/:roomId/messages

// User routes
router.get("/users/:userId/rooms", chatController.getUserRooms); // GET /api/v1/chat/users/:userId/rooms
router.get("/users/:userId/unread", chatController.getUnreadCount); // GET /api/v1/chat/users/:userId/unread
router.get("/users/:userId/list", chatController.getChatList); // GET /api/v1/chat/users/:userId/list (Recent Chats with details)

// Participants
router.post("/rooms/:roomId/participants", chatController.addParticipant); // POST /api/v1/chat/rooms/:roomId/participants

// ==========================================
// Ticket Comments (Chat per Tiket)
// ==========================================
router.get("/tickets/:ticketId/comments", chatController.getTicketComments); // GET all comments for a ticket
router.get("/tickets/:ticketId/comments/public", chatController.getPublicTicketComments); // GET public comments only
router.get("/tickets/:ticketId/comments/internal", chatController.getInternalTicketComments); // GET internal comments only
router.post("/tickets/:ticketId/comments", chatController.createTicketComment); // POST new comment
router.delete("/tickets/comments/:commentId", chatController.deleteTicketComment); // DELETE comment

export default router;
