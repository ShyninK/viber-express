import express from "express";
import * as chatController from "../controllers/chatController.js";

const router = express.Router();

// Chat Room routes
router.get("/rooms", chatController.getRooms); // GET /api/v1/chat/rooms
router.get("/rooms/:roomId", chatController.getRoomById); // GET /api/v1/chat/rooms/:roomId
router.post("/rooms", chatController.createRoom); // POST /api/v1/chat/rooms

// Messages routes
router.get("/rooms/:roomId/messages", chatController.getMessages); // GET /api/v1/chat/rooms/:roomId/messages

// User routes
router.get("/users/:userId/rooms", chatController.getUserRooms); // GET /api/v1/chat/users/:userId/rooms
router.get("/users/:userId/unread", chatController.getUnreadCount); // GET /api/v1/chat/users/:userId/unread

// Participants
router.post("/rooms/:roomId/participants", chatController.addParticipant); // POST /api/v1/chat/rooms/:roomId/participants

export default router;
