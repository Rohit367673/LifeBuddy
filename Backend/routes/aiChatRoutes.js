const express = require('express');
const router = express.Router();
const { authenticateUser: auth } = require('../middlewares/authMiddleware');
const MistralService = require('../services/mistralService');
const User = require('../models/User');
const ScheduleInteraction = require('../models/ScheduleInteraction');

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
 * POST /api/ai-chat/coding
 * Coding-specific AI help
 */
router.post('/coding', auth, async (req, res) => {
  try {
    const { question, codeContext = '' } = req.body;
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
