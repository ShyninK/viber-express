import express from "express";
import * as surveyController from "../controllers/surveysControllers.js";

const router = express.Router();

router.get("/", surveyController.index);
export default router;
// test
