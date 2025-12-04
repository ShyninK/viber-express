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

// Get surveys by current user
export const getMySurveys = async (req, res) => {
  try {
    const surveys = await surveyModel.getSurveysByUser(req.user.id);
    res.json({ success: true, data: surveys });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Check survey status for a ticket (one-to-one)
export const checkSurveyStatus = async (req, res) => {
  try {
    const { ticket_id } = req.params;
    const hasSurvey = await surveyModel.hasTicketSurvey(ticket_id);
    
    res.json({ success: true, hasSurvey });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get survey by ID
export const getSurveyById = async (req, res) => {
  try {
    const { id } = req.params;
    const survey = await surveyModel.getSurveyById(id);
    
    if (!survey) {
      return res.status(404).json({ status: false, error: "Survey tidak ditemukan" });
    }
    
    res.json({ status: true, data: survey });
  } catch (error) {
    res.status(500).json({ status: false, error: error.message });
  }
};

// Create survey
export const submitSurvey = async (req, res) => {
  try {
    const { ticket_id, rating, feedback, category } = req.body;
    
    const survey = await surveyModel.createSurvey(
      ticket_id, 
      req.user.id, 
      rating, 
      feedback,
      category
    );
    
    res.status(201).json({ 
      success: true, 
      message: "Survey berhasil disubmit",
      data: survey 
    });
  } catch (error) {
    if (error.message.includes("sudah mengisi")) {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: error.message });
  }
};