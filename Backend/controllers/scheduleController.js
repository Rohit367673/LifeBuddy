const { generateMessageWithOpenRouter } = require('../services/openRouterService');
const User = require('../models/User');
const mongoose = require('mongoose');

// POST /api/schedule
exports.generateScheduleForUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required.' });

    // ChatGPT-style, multi-part, topic-specific prompt
    const aiPrompt = `You are an expert teacher and explainer. For the following user request, generate a detailed, ChatGPT-style answer with the following structure:\n1. Introduction and key points about the topic.\n2. Examples, analogies, or step-by-step explanations as needed.\n3. Useful resources, further reading, and a brief conclusion.\n\nUser request: ${prompt}`;
    const aiResponse = await generateMessageWithOpenRouter(aiPrompt, 800);
    console.log('Raw AI Response:', aiResponse);
    if (!aiResponse) return res.status(500).json({ error: 'AI did not return a response.' });

    // Store as a single message (array for compatibility)
    const schedule = [{ day: 1, content: aiResponse.trim() }];
    await User.findByIdAndUpdate(userId, { $set: { aiSchedule: schedule, aiScheduleLastSentDay: 0 } });

    res.json({ schedule });
  } catch (error) {
    console.error('Schedule generation error:', error);
    res.status(500).json({ error: 'Failed to generate schedule.' });
  }
}; 