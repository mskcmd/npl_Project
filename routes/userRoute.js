const express = require("express");
const { getAllTexts, postNewText, getHome, getYoutubeSummarizer, summarizeYouTube } = require("../controllers/textController");

const router = express.Router();

// Home route
router.get("/", getHome);

// Routes for word analysis
router.get("/word-analyzer", getAllTexts); // Get all texts for analysis
router.post("/word-analyzer", postNewText); // Post new text for analysis

// Routes for YouTube video summarization
router.get("/youtube-summarizer", getYoutubeSummarizer); // Render the YouTube summarizer page
router.post("/youtube-summarizer", summarizeYouTube); // Summarize a YouTube video

module.exports = router;
