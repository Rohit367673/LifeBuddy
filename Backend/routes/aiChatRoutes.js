const express = require('express');
const router = express.Router();
const { authenticateUser: auth } = require('../middlewares/authMiddleware');
const { requirePremium } = require('../middlewares/premiumMiddleware');
const { generateMessageWithOpenRouter } = require('../services/openRouterService');
const User = require('../models/User');
const ScheduleInteraction = require('../models/ScheduleInteraction');
const PremiumTask = require('../models/PremiumTask');
const ChatMessage = require('../models/ChatMessage');

// Enhanced query filter to block irrelevant/abusive inputs
function isIrrelevantQuery(text = '') {
  if (!text || typeof text !== 'string') return { blocked: true, reason: 'empty' };
  const msg = text.toLowerCase().trim();
  if (msg.length < 2) return { blocked: true, reason: 'too_short' };
  
  // Whitelist common learning/explanation forms to avoid over-blocking
  const learningStarters = ['what is ', 'explain ', 'how does ', 'how do ', 'define ', 'give me an overview of ', 'teach me '];
  const interrogativeRegex = /^(what|how|why|when|where|who|which|can|should|could|would|explain|define|tell me|give me|help me)\b/;
  if (learningStarters.some(prefix => msg.startsWith(prefix)) || interrogativeRegex.test(msg)) {
    return { blocked: false };
  }
  
  // Harmful content
  const harmful = [
    'kill', 'suicide', 'self harm', 'self-harm', 'hurt myself', 'end my life',
    'hate speech', 'racist', 'sexist', 'homophobic', 'transphobic',
    'nsfw', 'sex', 'porn', 'adult content', 'explicit'
  ];
  if (harmful.some(k => msg.includes(k))) {
    return { blocked: true, reason: 'harmful', message: "I'm here to help with productivity, learning, and positive life management. If you're struggling, please reach out to a mental health professional or crisis helpline." };
  }
  
  // Security/privacy risks
  const security = [
    'credit card', 'password', 'ssn', 'social security', 'bank account',
    'api key', 'token', 'login credentials', 'personal information'
  ];
  if (security.some(k => msg.includes(k))) {
    return { blocked: true, reason: 'security', message: "I can't help with sensitive personal or financial information. Please keep your private data secure." };
  }
  
  // Off-topic entertainment requests
  const entertainment = [
    'tell me a joke', 'sing a song', 'write a poem', 'tell a story',
    'play a game', 'riddle', 'trivia', 'entertainment'
  ];
  if (entertainment.some(k => msg.includes(k))) {
    return { blocked: true, reason: 'entertainment', message: "I'm focused on helping you with productivity, learning, fitness, and life management. How can I assist you with your goals today?" };
  }
  
  // AI identity questions
  const identity = [
    'what\'s your name', 'are you chatgpt', 'are you gpt', 'who made you',
    'what model are you', 'say deepseek', 'are you deepseek', 'what ai are you',
    'who created you', 'what company made you'
  ];
  if (identity.some(k => msg.includes(k))) {
    return { blocked: true, reason: 'identity', message: "I'm LifeBuddy AI, created by Rohit Kumar to help you with productivity, learning, fitness, and life management. What can I help you achieve today?" };
  }
  
  // Spam/gibberish
  if (msg.length > 500 || /(.)\1{10,}/.test(msg) || msg.split(' ').length < 2) {
    return { blocked: true, reason: 'spam', message: "Please ask a clear question about productivity, learning, fitness, or life management." };
  }
  
  return { blocked: false };
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
router.post('/general', auth, requirePremium, async (req, res) => {
  try {
    const { message, topic = 'general' } = req.body;
    const userId = req.user.id;

    // Enhanced query filtering with polite refusal
    const filterResult = isIrrelevantQuery(message);
    if (filterResult.blocked) {
      return res.json({
        success: true,
        response: filterResult.message || "I can't help with that request. Please ask about productivity, learning, fitness, or life management.",
        filtered: true,
        reason: filterResult.reason
      });
    }

    // Get user with profile data
    const user = await User.findById(userId).select('name learningStyle goals experienceLevel communicationStyle');
    
    // Get recent user context (last 10 interactions)
    const userContext = await ScheduleInteraction.find({ user: userId })
      .sort({ occurredAt: -1 })
      .limit(10)
      .select('action description occurredAt metadata');

    // Generate personalized response via OpenRouter (configured model)
    const prompt = `You are LifeBuddy AI. Personalize your answer using the user's profile and recent interactions.
User Profile: ${JSON.stringify(user)}
Recent Interactions: ${JSON.stringify(userContext)}
Topic: ${topic}
User Message: ${message}

Respond clearly, concisely, and helpfully. Provide step-by-step guidance if relevant.`;
    const response = await generateMessageWithOpenRouter(prompt, 600, 0.7);

    // Save chat messages with 24-hour TTL
    const startTime = Date.now();
    // user message
    await ChatMessage.create({ user: userId, role: 'user', content: message, topic, aiService: 'openrouter' });
    // ai message
    await ChatMessage.create({
      user: userId,
      role: 'ai',
      content: response,
      topic,
      aiService: 'openrouter',
      metadata: {
        responseTime: Date.now() - startTime
      }
    });

    // Log this interaction for future context
    await ScheduleInteraction.create({
      user: userId,
      action: 'ai_chat',
      description: `AI chat: ${message.substring(0, 100)}...`,
      occurredAt: new Date(),
      metadata: {
        topic,
        query: message,
        responseLength: response.length
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
router.get('/schedule', auth, requirePremium, async (req, res) => {
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
    const filterResult = isIrrelevantQuery(message);
    if (filterResult.blocked) {
      // Debug visibility for filter behavior (non-sensitive)
      try { console.log('[/api/ai-chat/ask] filtered query', { reason: filterResult.reason }); } catch (_) {}
      return res.json({
        success: true,
        response: filterResult.message || 'I can’t help with that request. Try asking about plans, schedules, productivity, fitness, coding help, or learning topics.',
        filtered: true,
        reason: filterResult.reason
      });
    }

    const user = await User.findById(req.user.id).select('displayName aiAssistantName aiThemeColor aiBackgroundStyle aiProfile subscription');
    const scheduleTask = await PremiumTask.findOne({ user: req.user.id }).sort({ createdAt: -1 });
    const currentSchedule = scheduleTask ? `Title: ${scheduleTask.title}; Day: ${scheduleTask.currentDay}` : 'No active schedule';

    const recentInteractions = await ScheduleInteraction.find({ user: req.user.id })
      .sort({ occurredAt: -1 })
      .limit(10)
      .select('action description occurredAt');

    const messageToSave = message || "User message was empty";
    // Save user message to chat history (TTL 24h)
    await ChatMessage.create({ user: req.user.id, role: 'user', content: messageToSave, topic: 'general' });

    // Use OpenRouter (configured model)
    let response = '';
    try {
      const prompt = `User: ${user?.displayName || 'friend'}\nSchedule: ${currentSchedule}\nRecent: ${JSON.stringify(recentInteractions)}\nQuestion: ${message}`;
      response = await generateMessageWithOpenRouter(prompt, 600, 0.7);
    } catch (openRouterErr) {
      console.warn('OpenRouter failed:', openRouterErr?.message || openRouterErr);
      response = 'Sorry, I could not generate a response right now. Please try again in a moment.';
    }

    // If response is empty, set a fallback
    if (typeof response !== 'string' || response.trim() === '') {
      response = "Sorry, I couldn't generate a response. Please try again.";
    }

    // Save chat message with 24-hour TTL
    await ChatMessage.create({ user: req.user.id, role: 'ai', content: response, topic: 'general' });

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

    // Enhanced query filtering with polite refusal
    const filterResult = isIrrelevantQuery(message);
    if (filterResult.blocked) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8');
      res.setHeader('Transfer-Encoding', 'chunked');
      if (typeof res.flushHeaders === 'function') res.flushHeaders();
      const msg = filterResult.message || "I can't help with that request. Please ask about productivity, learning, fitness, or life management.";
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
      fullText = await generateMessageWithOpenRouter(prompt, 600, 0.7);
    } catch (err) {
      // If OpenRouter fails, send a friendly message instead of 404/500 to keep UX smooth
      fullText = 'Sorry, my AI brain is busy right now. Please try again in a moment.';
    }
    if (!fullText || typeof fullText !== 'string') {
      fullText = 'Sorry, I could not generate a response right now.';
    }

    // Save chat messages with 24-hour TTL (role-based)
    await ChatMessage.create({ user: req.user.id, role: 'user', content: message || "User message was empty", topic: 'general', aiService: 'openrouter' });
    await ChatMessage.create({
      user: req.user.id,
      role: 'ai',
      content: fullText,
      topic: 'general',
      aiService: 'openrouter',
      metadata: { streaming: true }
    });

    const chunkSize = 96;
    let index = 0;
    const startTs = Date.now();
    const maxMs = 30000; // 30s safety timeout
    let ended = false;
    const endStream = () => {
      if (ended) return;
      ended = true;
      try { res.write('\n'); } catch (_) {}
      try { res.end(); } catch (_) {}
    };
    const timer = setInterval(() => {
      if (index >= fullText.length) {
        clearInterval(timer);
        endStream();
        return;
      }
      if (Date.now() - startTs > maxMs) {
        // Guard against long-running steps
        clearInterval(timer);
        endStream();
        return;
      }
      const chunk = fullText.slice(index, index + chunkSize);
      index += chunkSize;
      try { res.write(chunk); } catch (e) { clearInterval(timer); endStream(); }
    }, 25);
    // Ensure we clean up if client disconnects
    try { res.on('close', () => { try { clearInterval(timer); } catch (_) {} endStream(); }); } catch (_) {}
  } catch (e) {
    console.error('AI stream error:', e);
    if (!res.headersSent) { return res.status(500).json({ success: false, message: e.message }); }
    try { res.end(); } catch (_) {}
  }
});

/**
 * GET /api/ai-chat/history
 * Retrieve chat history for the user (auto-deleted after 24 hours)
 */
router.get('/history', auth, async (req, res) => {
  try {
    const { limit = 20, topic } = req.query;
    const query = { user: req.user.id };
    
    if (topic && ['general', 'coding', 'fitness', 'education', 'productivity'].includes(topic)) {
      query.topic = topic;
    }

    const chatHistory = await ChatMessage.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .select('content response topic aiService createdAt metadata');

    res.json({
      success: true,
      history: chatHistory.reverse(), // Show oldest first for conversation flow
      count: chatHistory.length
    });
  } catch (error) {
    console.error('Chat history error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/ai-chat/history
 * Clear all chat history for the user
 */
router.delete('/history', auth, async (req, res) => {
  try {
    const result = await ChatMessage.deleteMany({ user: req.user.id });
    
    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} chat messages`,
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('Clear chat history error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
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
router.post('/coding', auth, requirePremium, async (req, res) => {
  try {
    const { question, codeContext = '' } = req.body;
    if (!question) return res.status(400).json({ success: false, message: 'question is required' });
    {
      const filterResult = isIrrelevantQuery(question);
      if (filterResult.blocked) {
        return res.json({ success: true, response: 'I can help with coding questions, best practices, and debugging. Try asking about your code, errors, or a specific concept.', filtered: true, reason: filterResult.reason });
      }
    }
    const userId = req.user.id;

    const user = await User.findById(userId).select('name learningStyle goals experienceLevel');
    const userContext = await ScheduleInteraction.find({ user: userId })
      .sort({ occurredAt: -1 })
      .limit(10)
      .select('action description occurredAt metadata');

    const codingPrompt = `You are LifeBuddy AI coding assistant. Be precise and practical.
User Profile: ${JSON.stringify(user)}
Question: ${question}
Code Context:\n${codeContext || '(none)'}

Explain reasoning briefly, then provide steps and example code if useful.`;
    const response = await generateMessageWithOpenRouter(codingPrompt, 800, 0.5);

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
router.post('/fitness', auth, requirePremium, async (req, res) => {
  try {
    const { question, fitnessGoals = '' } = req.body;
    if (!question) return res.status(400).json({ success: false, message: 'question is required' });
    {
      const filterResult = isIrrelevantQuery(question);
      if (filterResult.blocked) {
        return res.json({ success: true, response: 'I can help with safe and effective fitness plans, routines, and nutrition. Ask about your goal and constraints.', filtered: true, reason: filterResult.reason });
      }
    }
    const userId = req.user.id;

    const user = await User.findById(userId).select('name learningStyle goals experienceLevel');
    const userContext = await ScheduleInteraction.find({ user: userId })
      .sort({ occurredAt: -1 })
      .limit(10)
      .select('action description occurredAt metadata');

    const fitnessPrompt = `You are LifeBuddy AI fitness coach. Give safe, evidence-based advice.
User Profile: ${JSON.stringify(user)}
Goals: ${fitnessGoals || '(not provided)'}
Question: ${question}

Provide actionable steps, cautions, and a simple plan.`;
    const response = await generateMessageWithOpenRouter(fitnessPrompt, 700, 0.7);

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
router.post('/education', auth, requirePremium, async (req, res) => {
  try {
    const { topic, difficulty = 'beginner' } = req.body;
    if (!topic) return res.status(400).json({ success: false, message: 'topic is required' });
    {
      const filterResult = isIrrelevantQuery(topic);
      if (filterResult.blocked) {
        return res.json({ success: true, response: 'I can break down complex topics into digestible parts. Ask for a roadmap or explanation on a subject.', filtered: true, reason: filterResult.reason });
      }
    }
    const userId = req.user.id;

    const user = await User.findById(userId).select('name learningStyle goals experienceLevel');
    const userContext = await ScheduleInteraction.find({ user: userId })
      .sort({ occurredAt: -1 })
      .limit(10)
      .select('action description occurredAt metadata');

    const educationPrompt = `You are LifeBuddy AI educator. Teach the topic clearly for a ${difficulty} learner.
User Profile: ${JSON.stringify(user)}
Topic: ${topic}

Break it down into key points, examples/analogies, and resources.`;
    const response = await generateMessageWithOpenRouter(educationPrompt, 800, 0.6);

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
router.post('/productivity', auth, requirePremium, async (req, res) => {
  try {
    const { question, currentSchedule = '' } = req.body;
    if (!question) return res.status(400).json({ success: false, message: 'question is required' });
    {
      const filterResult = isIrrelevantQuery(question);
      if (filterResult.blocked) {
        return res.json({ success: true, response: 'I can help with time management, habits, and scheduling. Ask me to plan your day or optimize your routine.', filtered: true, reason: filterResult.reason });
      }
    }
    const userId = req.user.id;

    const user = await User.findById(userId).select('name learningStyle goals experienceLevel');
    const userContext = await ScheduleInteraction.find({ user: userId })
      .sort({ occurredAt: -1 })
      .limit(10)
      .select('action description occurredAt metadata');

    const productivityPrompt = `You are LifeBuddy AI productivity coach.
User Profile: ${JSON.stringify(user)}
Current Schedule Context: ${currentSchedule || '(none)'}
Question: ${question}

Give concrete steps, prioritization tips, and time-block suggestions.`;
    const response = await generateMessageWithOpenRouter(productivityPrompt, 700, 0.6);

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
