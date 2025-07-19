const fetch = require('node-fetch');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'mistralai/mistral-7b-instruct';

// Fallback static message
const FALLBACK_MESSAGE = 'Stay focused and positive! You are making great progress.';

async function generateMessageWithOpenRouter(prompt, maxTokens = 100) {
  if (!OPENROUTER_API_KEY) {
    console.error('OPENROUTER_API_KEY not set in .env');
    return FALLBACK_MESSAGE;
  }
  try {
    const response = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: 'user', content: prompt }
        ],
        max_tokens: maxTokens
      })
    });
    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenRouter API error:', response.status, errorData);
      return FALLBACK_MESSAGE;
    }
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    return content || FALLBACK_MESSAGE;
  } catch (error) {
    console.error('OpenRouter API call failed:', error);
    return FALLBACK_MESSAGE;
  }
}

module.exports = { generateMessageWithOpenRouter }; 