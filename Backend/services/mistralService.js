const axios = require('axios');

class MistralService {
  constructor() {
    this.apiKey = process.env.MISTRAL_API_KEY;
    this.baseUrl = 'https://api.mistral.ai/v1';
    this.model = process.env.MISTRAL_MODEL || 'mistral-large-latest';
  }

  /**
   * Generate personalized AI response using context injection
   * @param {Object} user - User object with profile and preferences
   * @param {string} userQuery - User's question/request
   * @param {Array} userContext - Array of recent interactions/context
   * @param {string} topic - Topic area (coding, fitness, education, etc.)
   * @returns {Promise<string>} AI response
   */
  async generatePersonalizedResponse(user, userQuery, userContext = [], topic = 'general') {
    try {
      // Build personalized system prompt
      const systemPrompt = this.buildSystemPrompt(user, topic);
      
      // Build context-aware user prompt
      const userPrompt = this.buildUserPrompt(userQuery, userContext, topic);
      
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 1000,
          top_p: 0.9
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Mistral AI API error:', error.response?.data || error.message);
      throw new Error(`Mistral AI error: ${error.response?.data?.error?.message || error.message}`);
    }
  }

  /**
   * Build personalized system prompt based on user profile and topic
   */
  buildSystemPrompt(user, topic) {
    const SYSTEM_PROMPT = `You are LifeBuddy AI, created by Rohit Kumar - a personalized productivity and life management assistant.

About LifeBuddy AI:
- You're part of the LifeBuddy platform, designed to help users optimize their daily routines, achieve goals, and maintain work-life balance
- Created by Rohit Kumar, a passionate developer who believes in empowering people through smart technology
- You specialize in productivity, personal development, learning, fitness, and life organization

Your personality and responses should be:
- Warm, encouraging, and genuinely supportive (like a trusted friend who cares about their success)
- Practical with actionable advice tailored to their specific situation
- Context-aware about their LifeBuddy journey, goals, and progress
- Professional yet personable - you're their dedicated life optimization partner
- Always reference their LifeBuddy experience when relevant

Never mention other AI models or providers. You ARE LifeBuddy AI, and this is your platform.
Always provide specific, implementable steps that integrate with their LifeBuddy workflow.`;

    const topicPrompts = {
      coding: `You are an expert coding mentor. Focus on:
- Providing clear, practical code examples
- Explaining concepts in simple terms
- Suggesting best practices and debugging tips
- Adapting explanations to the user's skill level`,
      
      fitness: `You are a fitness and wellness coach. Focus on:
- Providing safe, effective exercise recommendations
- Considering the user's fitness level and goals
- Offering nutrition and lifestyle advice
- Motivating and encouraging healthy habits`,
      
      education: `You are an educational tutor. Focus on:
- Breaking down complex topics into digestible parts
- Using examples and analogies that resonate
- Adapting to different learning styles
- Providing study strategies and tips`,
      
      productivity: `You are a productivity expert. Focus on:
- Time management and scheduling advice
- Task prioritization strategies
- Building effective habits and routines
- Overcoming procrastination and distractions`
    };

    const userProfile = `User Profile:
- Name: ${user.name || 'User'}
- Learning Style: ${user.learningStyle || 'Visual'}
- Goals: ${user.goals?.join(', ') || 'General improvement'}
- Experience Level: ${user.experienceLevel || 'Beginner'}
- Preferred Communication: ${user.communicationStyle || 'Direct and clear'}`;

    return `${SYSTEM_PROMPT}

${topicPrompts[topic] || topicPrompts.productivity}

${userProfile}

Always provide practical, actionable advice tailored to this specific user. Be encouraging and supportive while maintaining accuracy and usefulness.`;
  }

  /**
   * Build context-aware user prompt
   */
  buildUserPrompt(userQuery, userContext, topic) {
    let contextString = '';
    
    if (userContext.length > 0) {
      contextString = `\n\nRecent Context (use this to personalize your response):
${userContext.slice(-5).map(ctx => `- ${ctx.description || ctx.action} (${ctx.timestamp})`).join('\n')}`;
    }

    return `Topic: ${topic}

User Query: ${userQuery}${contextString}

Please provide a personalized, helpful response that considers the user's profile and recent context.`;
  }

  /**
   * Generate coding help with user context
   */
  async generateCodingHelp(user, question, codeContext = '', userContext = []) {
    const enhancedQuery = `Coding Question: ${question}\n\nCode Context:\n${codeContext}`;
    return this.generatePersonalizedResponse(user, enhancedQuery, userContext, 'coding');
  }

  /**
   * Generate fitness advice with user context
   */
  async generateFitnessAdvice(user, question, fitnessGoals = '', userContext = []) {
    const enhancedQuery = `Fitness Question: ${question}\n\nFitness Goals: ${fitnessGoals}`;
    return this.generatePersonalizedResponse(user, enhancedQuery, userContext, 'fitness');
  }

  /**
   * Generate educational content with user context
   */
  async generateEducationalContent(user, topic, difficulty = 'beginner', userContext = []) {
    const enhancedQuery = `Educational Topic: ${topic}\n\nDifficulty Level: ${difficulty}`;
    return this.generatePersonalizedResponse(user, enhancedQuery, userContext, 'education');
  }

  /**
   * Generate productivity advice with user context
   */
  async generateProductivityAdvice(user, question, currentSchedule = '', userContext = []) {
    const enhancedQuery = `Productivity Question: ${question}\n\nCurrent Schedule: ${currentSchedule}`;
    return this.generatePersonalizedResponse(user, enhancedQuery, userContext, 'productivity');
  }

  /**
   * Generate detailed schedule using Mistral AI
   * This serves as a fallback when OpenRouter is unavailable
   */
  async generateScheduleWithMistral(title, requirements, startDate, endDate, userContext = {}) {
    try {
      // Calculate number of days (max 31 for a month)
      const days = Math.min(31, Math.ceil((new Date(endDate) - new Date(startDate)) / (1000*60*60*24)) + 1);

      // Build comprehensive prompt for schedule generation
      const systemPrompt = `You are LifeBuddy, an AI scheduling and planning assistant. Your task is to create a detailed, day-by-day learning schedule.`;

      const userPrompt = `Create a detailed ${days}-day learning schedule for: "${title}"

User Context: ${JSON.stringify(userContext)}

Requirements: ${requirements || 'N/A'}

For each day, generate a comprehensive learning plan with these sections:
1. ✨ Day Title
2. 📚 Key Points or Subtopics (at least 5, each with a 1–2 sentence explanation)
3. 📝 Examples/Analogies (at least 2, each detailed)
4. 🔗 Resources (at least 3, with links)
5. 💡 Tips (at least 2, actionable and practical)
6. 🕐 Duration for each section (in minutes)
7. 🧠 Motivation

IMPORTANT: You must start each day with 'Day N:' (e.g., Day 1:, Day 2:). Each section must be present and detailed. Make the schedule practical and achievable.`;

      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 4000,
          top_p: 0.9
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          }
        }
      );

      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('Mistral AI schedule generation error:', error.response?.data || error.message);
      throw new Error(`Mistral AI schedule generation failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}

module.exports = new MistralService();
