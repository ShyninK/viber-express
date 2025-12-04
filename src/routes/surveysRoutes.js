import express from "express";
import * as surveyController from "../controllers/surveysControllers.js";
// import { authenticate } from "../middleware/auth.js";

const router = express.Router();

// Get all surveys (admin)
router.get("/", surveyController.index);

// Get my surveys (harus sebelum /:id)
router.get("/my-surveys", surveyController.getMySurveys);

// Check if user already submitted survey for ticket
router.get("/check/:ticket_id", surveyController.checkSurveyStatus);

// Get survey by ID (harus setelah route spesifik)
router.get("/:id", surveyController.getSurveyById);

// Submit survey
router.post("/", surveyController.submitSurvey);

export default router;