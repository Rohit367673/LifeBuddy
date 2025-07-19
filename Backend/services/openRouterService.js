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

async function generateScheduleWithOpenRouter(title, requirements, startDate, endDate) {
  const days = Math.ceil((new Date(endDate) - new Date(startDate)) / (1000*60*60*24)) + 1;
  const schedule = [];
  for (let i = 0; i < days; i++) {
    const date = new Date(new Date(startDate).getTime() + i * 24*60*60*1000);
    const prompt = `Generate a short, actionable learning task for day ${i+1} of a personalized schedule.\nTitle: ${title}\nRequirements: ${requirements || 'None'}\nDay: ${i+1}\nFormat: Task, Motivation, Resources (comma separated), Exercises (comma separated), Notes.`;
    const response = await generateMessageWithOpenRouter(prompt, 100);
    // Parse response (simple split, fallback if needed)
    let subtask = response, motivationTip = '', resources = [], exercises = [], notes = '';
    if (response.includes('Motivation:')) {
      const parts = response.split('Motivation:');
      subtask = parts[0].trim();
      const rest = parts[1] || '';
      const resMatch = rest.match(/Resources:(.*)/);
      const exMatch = rest.match(/Exercises:(.*)/);
      const notesMatch = rest.match(/Notes:(.*)/);
      motivationTip = rest.split('Resources:')[0].replace('Motivation:', '').trim();
      resources = resMatch ? resMatch[1].split(',').map(r => r.trim()).filter(Boolean) : [];
      exercises = exMatch ? exMatch[1].split(',').map(e => e.trim()).filter(Boolean) : [];
      notes = notesMatch ? notesMatch[1].trim() : '';
    }
    schedule.push({
      date,
      subtask,
      status: 'pending',
      motivationTip,
      resources,
      exercises,
      notes,
      day: i + 1
    });
  }
  return schedule;
}

module.exports = { generateMessageWithOpenRouter, generateScheduleWithOpenRouter }; 