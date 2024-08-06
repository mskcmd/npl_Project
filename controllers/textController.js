const Text = require("../models/Text");
const natural = require("natural");
const tokenizer = new natural.WordTokenizer();
const sentenceTokenizer = new natural.SentenceTokenizer();
const { OpenAI } = require("openai");
const ytdl = require('ytdl-core');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});


let requestCount = 0; // Global request counter for demonstration purposes
const RATE_LIMIT = 1000000000; // Example rate limit, adjust based on your needs

const summarizeWithOpenAI = async (videoTranscript) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: "You are a helpful assistant that summarizes YouTube video transcripts." },
        { role: "user", content: `Summarize the following video transcript:\n\n${videoTranscript}` }
      ],
      max_tokens: 150,
      temperature: 0.5
    });
    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error('Error summarizing with OpenAI:', error);
    if (error.error?.type === 'insufficient_quota' || error.status === 429) {
      throw new Error('OpenAI API quota exceeded. Please check your plan and billing details.');
    }
    throw new Error('Failed to summarize video: ' + error.message);
  }
};

const fallbackSummarize = (text, maxSentences = 3) => {
  const sentences = sentenceTokenizer.tokenize(text);
  return sentences.slice(0, maxSentences).join(' ');
};

const getVideoTranscript = async (videoId) => {
  try {
    const info = await ytdl.getInfo(videoId);
    const trackInfo = info.player_response.captions?.playerCaptionsTracklistRenderer?.captionTracks[0];
    if (trackInfo) {
      const response = await fetch(trackInfo.baseUrl);
      const transcript = await response.text();
      return transcript;
    }
    throw new Error('No transcript available');
  } catch (error) {
    console.error('Error fetching transcript:', error);
    throw new Error('Failed to fetch video transcript');
  }
};

const summarizeYouTube = async (req, res) => {
  const { videoLink } = req.body;
  if (!videoLink) {
    return res.status(400).render("youtube-summarizer", { error: "Video link is required", summary: null, videoLink: null });
  }

  // Check rate limit
  if (requestCount >= RATE_LIMIT) {
    return res.status(429).render("youtube-summarizer", { error: "Rate limit exceeded. Please try again later.", videoLink });
  }

  try {
    const videoId = ytdl.getVideoID(videoLink);
    const videoTranscript = await getVideoTranscript(videoId);
    let summary;
    try {
      summary = await summarizeWithOpenAI(videoTranscript);
      if (summary.includes('OpenAI API quota exceeded')) {
        // If OpenAI quota exceeded, use fallback summarization
        summary = fallbackSummarize(videoTranscript);
      }
    } catch (openaiError) {
      console.error('OpenAI summarization failed, using fallback method:', openaiError);
      summary = fallbackSummarize(videoTranscript);
    }
    res.render("youtube-summarizer", { summary, videoLink });
  } catch (error) {
    console.error('Error in summarizeYouTube:', error);
    res.status(500).render("youtube-summarizer", { error: "Failed to fetch summary. Please try again later.", videoLink });
  } finally {
    requestCount++; // Increment request count after processing
  }
};

const getHome = async (req, res) => {
  try {
    res.render("home");
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};

const getYoutubeSummarizer = async (req, res) => {
  try {
    res.render("youtube-summarizer", { summary: null, videoLink: null });
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};

const getAllTexts = async (req, res) => {
  try {
    const texts = await Text.find();
    res.render("index", { texts });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

const postNewText = async (req, res) => {
  try {
    const { content } = req.body;
    const newText = new Text({ content });

    const analyzer = new natural.SentimentAnalyzer(
      "English",
      natural.PorterStemmer,
      "afinn"
    );
    const analysis = analyzer.getSentiment(tokenizer.tokenize(content));

    newText.sentiment = analysis;

    await newText.save();
    res.redirect("/word-analyzer");
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

module.exports = {
  getAllTexts,
  postNewText,
  getHome,
  getYoutubeSummarizer,
  summarizeYouTube
};
