console.log('LOADING openRouterService.js at', new Date().toISOString());
const fetch = require('node-fetch');

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const DEFAULT_MODEL = 'tngtech/deepseek-r1t2-chimera:free';
const FALLBACK_MESSAGE = 'Stay focused and positive! You are making great progress.';

/**
 * Generate a message using OpenRouter AI.
 * @param {string} prompt - The prompt to send to the AI.
 * @param {number} maxTokens - Maximum tokens for the response.
 * @param {string} [model] - Optional model override.
 * @param {string} [apiKey] - Optional API key override.
 * @returns {Promise<string>} - The AI-generated message or fallback.
 */
async function generateMessageWithOpenRouter(prompt, maxTokens = 400, model = DEFAULT_MODEL, apiKey) {
  apiKey = apiKey || process.env.OPENROUTER_API_KEY;
  console.log('DEBUG: apiKey at call:', apiKey);
  console.log('--- OpenRouter AI Debug ---');
  console.log('Prompt:', prompt);
  console.log('API Key present:', !!apiKey);
  console.log('Model:', model);
  if (!apiKey) {
    console.error('OPENROUTER_API_KEY not set in .env or passed to function');
    console.error('FALLBACK TRIGGERED: No API key');
    return FALLBACK_MESSAGE;
  }
  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: maxTokens,
        temperature: 0.7
      })
    });
    console.log('OpenRouter API status:', response.status);
    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenRouter API error:', response.status, errorData);
      console.error('FALLBACK TRIGGERED: API error');
      return FALLBACK_MESSAGE;
    }
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    console.log('OpenRouter API content:', content);
    if (!content) {
      console.error('FALLBACK TRIGGERED: No content in response');
    }
    return content || FALLBACK_MESSAGE;
  } catch (error) {
    console.error('OpenRouter API call failed:', error);
    console.error('FALLBACK TRIGGERED: Exception');
    return FALLBACK_MESSAGE;
  }
}

module.exports = {
  generateMessageWithOpenRouter,
  FALLBACK_MESSAGE,
}; 