const express = require('express');
const router = express.Router();
const { authenticateUser: auth } = require('../middlewares/authMiddleware');
const { requirePremium } = require('../middlewares/premiumMiddleware');
const MistralService = require('../services/mistralService');
const { generateMessageWithOpenRouter } = require('../services/openRouterService');
const User = require('../models/User');
const ScheduleInteraction = require('../models/ScheduleInteraction');
const PremiumTask = require('../models/PremiumTask');
const ChatMessage = require('../models/ChatMessage');

// Query filter to block irrelevant/abusive inputs
function isIrrelevantQuery(text = '') {
  if (!text || typeof text !== 'string') return true;
  const msg = text.toLowerCase().trim();
  if (msg.length < 2) return true;
  const banned = [
    'kill', 'suicide', 'self harm', 'hate speech', 'racist', 'nsfw', 'sex', 'porn',
    'credit card', 'password', 'ssn', 'social security', 'bank account'
  ];
  if (banned.some(k => msg.includes(k))) return true;
  const lowValue = [
    'tell me a joke', 'sing a song', 'what\'s your name', 'are you chatgpt',
    'who made you', 'what model are you', 'say deepseek', 'are you deepseek'
  ];
  if (lowValue.some(k => msg.includes(k))) return true;
  return false;
}

// Helper kept for backward compatibility (not used)
function requirePremiumLegacy(req, res, next) {
  const plan = req.user?.subscription?.plan;
  if (plan && plan !== 'free') return next();
  return res.status(403).json({ success: false, message: 'Premium required' });
}

/**
 * POST /api/ai-chat/general
 * General AI chat with personalization
 */
router.post('/general', auth, async (req, res) => {
  try {
    const { message, topic = 'general' } = req.body;
    const userId = req.user.id;

    // Get user with profile data
    const user = await User.findById(userId).select('name learningStyle goals experienceLevel communicationStyle');
    
    // Get recent user context (last 10 interactions)
    const userContext = await ScheduleInteraction.find({ user: userId })
      .sort({ occurredAt: -1 })
      .limit(10)
      .select('action description occurredAt metadata');

    // Generate personalized response
    const response = await MistralService.generatePersonalizedResponse(
      user,
      message,
      userContext,
      topic
    );

    // Log this interaction for future context
    await ScheduleInteraction.create({
      user: userId,
      action: 'ai_chat',
      description: `AI chat: ${message.substring(0, 100)}...`,
      occurredAt: new Date(),
      metadata: {
        topic,
        query: message,
        responseLength: response.length,
        model: 'mistral'
      }
    });

    res.json({
      success: true,
      response,
      topic,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('AI Chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ai-chat/schedule
 * Fetch current premium schedule for the user (for AI context)
 */
router.get('/schedule', auth, async (req, res) => {
  try {
    const task = await PremiumTask.findOne({ user: req.user.id }).sort({ createdAt: -1 });
    if (!task) return res.status(404).json({ success: false, message: 'No schedule found' });
    res.json({ success: true, schedule: task.generatedSchedule, title: task.title, currentDay: task.currentDay });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/**
 * POST /api/ai-chat/ask
 * Ask AI about schedule or personal queries; uses user_id personalization
 */
router.post('/ask', auth, requirePremium, async (req, res) => {
  try {
    const { message } = req.body;
    if (!message) return res.status(400).json({ success: false, message: 'message is required' });

    // Filter irrelevant/blocked queries
    if (isIrrelevantQuery(message)) {
      return res.json({ success: true, response: 'I can’t help with that request. Try asking about plans, schedules, productivity, fitness, coding help, or learning topics.' });
    }

    const user = await User.findById(req.user.id).select('displayName aiAssistantName aiThemeColor aiBackgroundStyle aiProfile subscription');
    const scheduleTask = await PremiumTask.findOne({ user: req.user.id }).sort({ createdAt: -1 });
    const currentSchedule = scheduleTask ? `Title: ${scheduleTask.title}; Day: ${scheduleTask.currentDay}` : 'No active schedule';

    const recentInteractions = await ScheduleInteraction.find({ user: req.user.id })
      .sort({ occurredAt: -1 })
      .limit(10)
      .select('action description occurredAt');

    // Save user message to chat history (TTL 24h)
    await ChatMessage.create({ user: req.user.id, role: 'user', content: message, topic: 'general' });

    // Prefer OpenRouter models with LifeBuddy system prompt; fallback to Mistral
    let response = '';
    try {
      const prompt = `User: ${user?.displayName || 'friend'}\nSchedule: ${currentSchedule}\nRecent: ${JSON.stringify(recentInteractions)}\nQuestion: ${message}`;
      response = await generateMessageWithOpenRouter(prompt, 600, 0.7, { model: 'meta-llama/llama-3.1-8b-instruct:free' });
    } catch (openRouterErr) {
      console.warn('OpenRouter failed, trying Mistral fallback:', openRouterErr?.message || openRouterErr);
      response = await MistralService.generateProductivityAdvice(
        user,
        message,
        currentSchedule,
        recentInteractions
      );
    }

    // Save assistant response
    await ChatMessage.create({ user: req.user.id, role: 'assistant', content: response, topic: 'general' });

    res.json({ success: true, response, aiName: user.aiAssistantName || 'LifeBuddy AI', themeColor: user.aiThemeColor, backgroundStyle: user.aiBackgroundStyle });
  } catch (e) {
    console.error('AI ask error:', e);
    res.status(500).json({ success: false, message: e.message });
  }
});

// Text streaming endpoint using OpenRouter with chunking
router.post('/stream', auth, requirePremium, async (req, res) => {
  try {
    const { message } = req.body || {};
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'message is required' });
    }

    // Filter irrelevant/blocked queries early
    if (isIrrelevantQuery(message)) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Transfer-Encoding', 'chunked');
      if (typeof res.flushHeaders === 'function') res.flushHeaders();
      const msg = 'I can’t help with that request. Try asking for plans, steps, summaries, or help with your schedule.';
      res.write(msg);
      return res.end();
    }

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Transfer-Encoding', 'chunked');
    if (typeof res.flushHeaders === 'function') res.flushHeaders();

    const user = await User.findById(req.user.id).select('displayName');
    const prompt = `User: ${user?.displayName || 'friend'}\nQuestion: ${message}`;

    let fullText = '';
    try {
      fullText = await generateMessageWithOpenRouter(prompt, 600, 0.7, { model: 'meta-llama/llama-3.1-8b-instruct:free' });
    } catch (err) {
      // If OpenRouter fails, send a friendly message instead of 404/500 to keep UX smooth
      fullText = 'Sorry, my AI brain is busy right now. Please try again in a moment.';
    }
    if (!fullText || typeof fullText !== 'string') {
      fullText = 'Sorry, I could not generate a response right now.';
    }

    // Save both sides of the conversation
    await ChatMessage.create({ user: req.user.id, role: 'user', content: message, topic: 'general' });
    await ChatMessage.create({ user: req.user.id, role: 'assistant', content: fullText, topic: 'general' });

    const chunkSize = 96;
    let index = 0;
    const timer = setInterval(() => {
      if (index >= fullText.length) {
        clearInterval(timer);
        try { res.write('\n'); res.end(); } catch (_) {}
        return;
      }
      const chunk = fullText.slice(index, index + chunkSize);
      index += chunkSize;
      try { res.write(chunk); } catch (e) { clearInterval(timer); try { res.end(); } catch (_) {} }
    }, 25);
  } catch (e) {
    console.error('AI stream error:', e);
    if (!res.headersSent) { return res.status(500).json({ success: false, message: e.message }); }
    try { res.end(); } catch (_) {}
  }
});

/**
 * POST /api/ai-chat/ai-name
 * Save custom AI assistant name in profile
 */
router.post('/ai-name', auth, requirePremium, async (req, res) => {
  try {
    const { name, themeColor, backgroundStyle } = req.body;
    const update = {};
    if (name) {
      if (!name || name.length > 40) return res.status(400).json({ success: false, message: 'Invalid name' });
      update.aiAssistantName = name.trim();
    }
    if (themeColor) update.aiThemeColor = String(themeColor);
    if (backgroundStyle) update.aiBackgroundStyle = backgroundStyle;
    await User.findByIdAndUpdate(req.user.id, update);
    res.json({ success: true, message: 'AI preferences updated', update });
  } catch (e) {
    res.status(500).json({ success: false, message: e.message });
  }
});

/**
 * POST /api/ai-chat/coding
 * Coding-specific AI help
 */
router.post('/coding', auth, async (req, res) => {
  try {
    const { question, codeContext = '' } = req.body;
    if (!question) return res.status(400).json({ success: false, message: 'question is required' });
    if (isIrrelevantQuery(question)) {
      return res.json({ success: true, response: 'I can help with coding questions, best practices, and debugging. Try asking about your code, errors, or a specific concept.' });
    }
    const userId = req.user.id;

    const user = await User.findById(userId).select('name learningStyle goals experienceLevel');
    const userContext = await ScheduleInteraction.find({ user: userId })
      .sort({ occurredAt: -1 })
      .limit(10)
      .select('action description occurredAt metadata');

    const response = await MistralService.generateCodingHelp(
      user,
      question,
      codeContext,
      userContext
    );

    // Log interaction
    await ScheduleInteraction.create({
      user: userId,
      action: 'ai_coding_help',
      description: `Coding help: ${question.substring(0, 100)}...`,
      occurredAt: new Date(),
      metadata: {
        topic: 'coding',
        question,
        codeContext: codeContext ? 'provided' : 'none',
        responseLength: response.length
      }
    });

    res.json({
      success: true,
      response,
      topic: 'coding',
      timestamp: new Date()
    });

  } catch (error) {
    console.error('AI Coding Chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ai-chat/fitness
 * Fitness-specific AI advice
 */
router.post('/fitness', auth, async (req, res) => {
  try {
    const { question, fitnessGoals = '' } = req.body;
    if (!question) return res.status(400).json({ success: false, message: 'question is required' });
    if (isIrrelevantQuery(question)) {
      return res.json({ success: true, response: 'I can help with safe and effective fitness plans, routines, and nutrition. Ask about your goal and constraints.' });
    }
    const userId = req.user.id;

    const user = await User.findById(userId).select('name learningStyle goals experienceLevel');
    const userContext = await ScheduleInteraction.find({ user: userId })
      .sort({ occurredAt: -1 })
      .limit(10)
      .select('action description occurredAt metadata');

    const response = await MistralService.generateFitnessAdvice(
      user,
      question,
      fitnessGoals,
      userContext
    );

    // Log interaction
    await ScheduleInteraction.create({
      user: userId,
      action: 'ai_fitness_advice',
      description: `Fitness advice: ${question.substring(0, 100)}...`,
      occurredAt: new Date(),
      metadata: {
        topic: 'fitness',
        question,
        fitnessGoals: fitnessGoals ? 'provided' : 'none',
        responseLength: response.length
      }
    });

    res.json({
      success: true,
      response,
      topic: 'fitness',
      timestamp: new Date()
    });

  } catch (error) {
    console.error('AI Fitness Chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ai-chat/education
 * Education-specific AI content
 */
router.post('/education', auth, async (req, res) => {
  try {
    const { topic, difficulty = 'beginner' } = req.body;
    if (!topic) return res.status(400).json({ success: false, message: 'topic is required' });
    if (isIrrelevantQuery(topic)) {
      return res.json({ success: true, response: 'I can break down complex topics into digestible parts. Ask for a roadmap or explanation on a subject.' });
    }
    const userId = req.user.id;

    const user = await User.findById(userId).select('name learningStyle goals experienceLevel');
    const userContext = await ScheduleInteraction.find({ user: userId })
      .sort({ occurredAt: -1 })
      .limit(10)
      .select('action description occurredAt metadata');

    const response = await MistralService.generateEducationalContent(
      user,
      topic,
      difficulty,
      userContext
    );

    // Log interaction
    await ScheduleInteraction.create({
      user: userId,
      action: 'ai_education',
      description: `Education: ${topic} (${difficulty})`,
      occurredAt: new Date(),
      metadata: {
        topic: 'education',
        subject: topic,
        difficulty,
        responseLength: response.length
      }
    });

    res.json({
      success: true,
      response,
      topic: 'education',
      subject: topic,
      difficulty,
      timestamp: new Date()
    });

  } catch (error) {
    console.error('AI Education Chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/ai-chat/productivity
 * Productivity-specific AI advice
 */
router.post('/productivity', auth, async (req, res) => {
  try {
    const { question, currentSchedule = '' } = req.body;
    if (!question) return res.status(400).json({ success: false, message: 'question is required' });
    if (isIrrelevantQuery(question)) {
      return res.json({ success: true, response: 'I can help with time management, habits, and scheduling. Ask me to plan your day or optimize your routine.' });
    }
    const userId = req.user.id;

    const user = await User.findById(userId).select('name learningStyle goals experienceLevel');
    const userContext = await ScheduleInteraction.find({ user: userId })
      .sort({ occurredAt: -1 })
      .limit(10)
      .select('action description occurredAt metadata');

    const response = await MistralService.generateProductivityAdvice(
      user,
      question,
      currentSchedule,
      userContext
    );

    // Log interaction
    await ScheduleInteraction.create({
      user: userId,
      action: 'ai_productivity',
      description: `Productivity advice: ${question.substring(0, 100)}...`,
      occurredAt: new Date(),
      metadata: {
        topic: 'productivity',
        question,
        hasSchedule: !!currentSchedule,
        responseLength: response.length
      }
    });

    res.json({
      success: true,
      response,
      topic: 'productivity',
      timestamp: new Date()
    });

  } catch (error) {
    console.error('AI Productivity Chat error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/ai-chat/context
 * Get user's AI chat context for frontend
 */
router.get('/context', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get recent AI interactions
    const aiInteractions = await ScheduleInteraction.find({
      user: userId,
      action: { $regex: /^ai_/ }
    })
    .sort({ occurredAt: -1 })
    .limit(20)
    .select('action description occurredAt metadata topic');

    // Get user profile for context
    const user = await User.findById(userId).select('name learningStyle goals experienceLevel communicationStyle');

    res.json({
      success: true,
      userProfile: user,
      recentInteractions: aiInteractions,
      availableTopics: ['general', 'coding', 'fitness', 'education', 'productivity']
    });

  } catch (error) {
    console.error('Get AI Context error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
