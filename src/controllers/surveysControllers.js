import * as surveyModel from "../models/surveysModel.js";

// Get ALL KB
export const index = async (req, res) => {
  try {
    const surveys = await surveyModel.getAllSurveys();
    res.status(200).json({ status: true, data: surveys });
  } catch (err) {
    res.status(500).json({ status: false, error: err.message });
  }
};