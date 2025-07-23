const fetch = require('node-fetch');

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'tngtech/deepseek-r1t2-chimera:free'; // Use Mixtral-8x7B for all AI schedule generation

// Debug logging
console.log('OpenRouter API Key loaded:', OPENROUTER_API_KEY ? 'YES' : 'NO');
console.log('OpenRouter API Key (first 10 chars):', OPENROUTER_API_KEY ? OPENROUTER_API_KEY.substring(0, 10) + '...' : 'NOT SET');

// REMOVE fallback content generator and fallback message
// function generateDetailedFallbackContent(topic, dayNumber) { ... }
// const FALLBACK_MESSAGE = 'Stay focused and positive! You are making great progress.';

async function generateMessageWithOpenRouter(prompt, maxTokens = 100) {
  if (!OPENROUTER_API_KEY) {
    console.error('OPENROUTER_API_KEY not set in .env');
    throw new Error('OpenRouter API key missing.');
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
        max_tokens: maxTokens,
        temperature: 0.7
      })
    });
    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenRouter API error:', response.status, errorData);
      throw new Error('OpenRouter API error: ' + errorData);
    }
    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    if (!content) throw new Error('OpenRouter API returned no content.');
    return content;
  } catch (error) {
    console.error('OpenRouter API call failed:', error);
    throw new Error('OpenRouter API call failed: ' + error.message);
  }
}

async function generateScheduleWithOpenRouter(title, requirements, startDate, endDate) {
  // Calculate number of days (max 31 for a month)
  const days = Math.min(31, Math.ceil((new Date(endDate) - new Date(startDate)) / (1000*60*60*24)) + 1);

  // Strict prompt
  let prompt = `You are an expert productivity and learning coach. Generate a ${days}-day advanced, engaging, and highly detailed learning plan for the topic: "${title}". The user requirements are: ${requirements || 'N/A'}.

For each day, provide:
- A detailed subtask or focus for the day (2-3 sentences, engaging, educational, and actionable)
- A motivational tip (1-2 sentences, inspiring, unique, and relevant to the day's focus)
- 2-3 high-quality resources (with links if possible, e.g. articles, videos, books, or tools)
- 2-3 hands-on exercises or challenges (with examples or instructions)
- A short note or summary (1-2 sentences, summarizing the day's learning or giving a pro tip)

Format each day as:
Day N:
Subtask: ...
Motivation: ...
Resources:
- ...
- ...
Exercises:
- ...
- ...
Notes: ...

Be creative, conversational, and make it feel like a ChatGPT answer. Use clear, friendly language. Do not include any introduction, summary, or extra text before Day 1: or after the last day. Only output the day blocks in the format above. Start with Day 1: and end with Day ${days}:.
`;

  let response;
  let schedule = [];
  let attempt = 0;
  let maxAttempts = 2;
  let hadEmptySubtask = false;
  while (attempt < maxAttempts) {
    attempt++;
    try {
      response = await generateMessageWithOpenRouter(prompt, 4000);
      console.log('OpenRouter raw response (attempt', attempt, '):', response);
    } catch (error) {
      console.error('Failed to generate AI content:', error);
      throw error;
    }
    // Parse the response into day-wise modules
    const dayRegex = /Day (\d+):([\s\S]*?)(?=Day \d+:|$)/g;
    const matches = [...response.matchAll(dayRegex)];
    schedule = [];
    hadEmptySubtask = false;
    for (const match of matches) {
      const dayNumber = parseInt(match[1], 10);
      const dayContent = match[2];
      // Robust regex for markdown/bold/whitespace
      let subtask = (dayContent.match(/(?:\*\*|__)?\s*Subtask\s*:? 0*(.*?)\s*(?:\*\*|__)?\n/i) || [])[1] || '';
      if (!subtask) {
        // fallback: first non-empty line after Day N:
        const lines = dayContent.split('\n').map(l => l.trim()).filter(Boolean);
        subtask = lines[0] || '';
      }
      const motivationTip = (dayContent.match(/(?:\*\*|__)?\s*Motivation\s*:? 0*(.*?)\s*(?:\*\*|__)?\n/i) || [])[1] || '';
      const resources = (dayContent.match(/(?:\*\*|__)?\s*Resources\s*:? 0*([\s\S]*?)(?:Exercises:|Notes:|$)/i) || [])[1]?.split(/- /).filter(s => s.trim()).map(s => s.trim().replace(/^\*\*|\*\*$/g, '')) || [];
      const exercises = (dayContent.match(/(?:\*\*|__)?\s*Exercises\s*:? 0*([\s\S]*?)(?:Notes:|$)/i) || [])[1]?.split(/- /).filter(s => s.trim()).map(s => s.trim().replace(/^\*\*|\*\*$/g, '')) || [];
      const notes = (dayContent.match(/(?:\*\*|__)?\s*Notes\s*:? 0*([\s\S]*)/i) || [])[1]?.trim() || '';
      if (!subtask) {
        hadEmptySubtask = true;
        console.warn('AI schedule parsing: subtask is empty for day', dayNumber, 'raw dayContent:', dayContent);
      }
      const date = new Date(new Date(startDate).getTime() + (dayNumber - 1) * 24*60*60*1000);
      schedule.push({
        date,
        subtask,
        status: 'pending',
        motivationTip,
        resources,
        exercises,
        notes,
        day: dayNumber,
        prerequisiteMet: dayNumber === 1,
        quiz: null,
        quizAnswered: false,
        quizCorrect: false
      });
    }
    // After parsing the AI response into days
    if (!Array.isArray(schedule) || schedule.length === 0 || schedule.some(day => !day.subtask)) {
      console.error('AI schedule parsing failed. Raw response:', response);
      throw new Error('AI did not return a valid schedule. Please try again or rephrase your topic.');
    }
    if (!hadEmptySubtask && schedule.length > 0) break;
    // If failed, retry with a shorter, even stricter prompt
    prompt = `Generate a ${days}-day plan for "${title}". For each day, use only these labels: Day N:, Subtask:, Motivation:, Resources:, Exercises:, Notes:. No formatting, no extra text. Start with Day 1: and end with Day ${days}:.`;
  }
  if (hadEmptySubtask || schedule.length === 0) {
    console.error('AI schedule generation failed after retries. Raw response:', response);
    throw new Error('AI failed to generate a valid schedule. Please try again or rephrase your topic.');
  }
  return schedule;
}

// Simple implementation to avoid breaking notification flow
function splitContentIntoMessages(fullContent, topic, dayNumber) {
  // For now, just return the full content as a single message
  return [fullContent];
}

module.exports = {
  generateScheduleWithOpenRouter,
  splitContentIntoMessages,
}; 