import express from "express";
import * as kbController from "../controllers/knowledgeBaseController.js";
// import { authenticate } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public routes
router.get("/", kbController.index); // GET /api/v1/knowledge-base?active=true&category=Tutorial&search=keyword
router.get("/:id", kbController.getById); // GET /api/v1/knowledge-base/:id

// Protected routes (uncomment authenticate when ready)
router.post("/", /* authenticate, */ kbController.create); // POST /api/v1/knowledge-base
router.put("/:id", /* authenticate, */ kbController.update); // PUT /api/v1/knowledge-base/:id
router.patch("/:id/deactivate", /* authenticate, */ kbController.softDelete); // PATCH /api/v1/knowledge-base/:id/deactivate
router.delete("/:id", /* authenticate, */ kbController.hardDelete); // DELETE /api/v1/knowledge-base/:id

export default router;
