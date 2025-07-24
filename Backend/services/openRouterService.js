const fetch = require('node-fetch');
const { TelegramService } = require('./messagingService');

const OPENROUTER_API_KEY = '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';
const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions';
const MODEL = 'mistralai/mixtral-8x7b-instruct';

// Debug logging
console.log('OpenRouter API Key loaded:', OPENROUTER_API_KEY ? 'YES' : 'NO');
console.log('OpenRouter API Key (first 10 chars):', OPENROUTER_API_KEY ? OPENROUTER_API_KEY.substring(0, 10) + '...' : 'NOT SET');


async function generateMessageWithOpenRouter(prompt, maxTokens = 100, temperature = 0.7) {
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
        temperature: temperature
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

  // ChatGPT-style, detailed, structured prompt with explicit example and length requirement
  let prompt = `You are LifeBuddy, an AI scheduling and planning assistant.

Today's topic is: "${title}"

User requirements:
${requirements ? requirements : 'N/A'}

For each day, generate a very long, detailed learning plan (at least 400 words) with these sections:
1. ✨ Day Title
2. 📚 Key Points or Subtopics (at least 5, each with a 1–2 sentence explanation)
3. 📝 Examples/Analogies (at least 2, each detailed)
4. 🔗 Resources (at least 3, with links)
5. 💡 Tips (at least 2, actionable and practical)
6. 🕐 Duration for each section (in minutes)
7. 🧠 Motivation

IMPORTANT: You must start each day with 'Day N:' (e.g., Day 1:, Day 2:). Do not omit this label. If you do not include this label, your response will be rejected. Each section must be present and detailed.

Here is an example of the level of detail and style I want:

Day 1:
✨ Day Title: Introduction to Sorting Algorithms
📚 Key Points:
- What is a sorting algorithm? (A sorting algorithm is a method for arranging elements in a list in a certain order, such as ascending or descending.)
- Why sorting is important in computer science (Sorting is fundamental for efficient searching, data organization, and is used in many algorithms.)
- Types of sorting algorithms (comparison-based, non-comparison-based) (Comparison-based sorts use element comparisons, while non-comparison sorts use other properties.)
- Stability in sorting (A stable sort preserves the order of equal elements.)
- Real-world applications (Sorting is used in databases, e-commerce, and more.)
📝 Examples/Analogies:
- Sorting books on a shelf by author, then by title.
- Organizing a playlist by song length, then by artist.
🔗 Resources:
- [Sorting Algorithms Overview](https://www.geeksforgeeks.org/sorting-algorithms/)
- [Sorting Algorithms Visualization](https://visualgo.net/en/sorting)
- [Sorting in Real Life](https://www.youtube.com/watch?v=ZZuD6iUe3Pc)
💡 Tips:
- Visualize the sorting process step by step.
- Try implementing a simple sort by hand before coding.
🕐 Duration: 40 minutes
🧠 Motivation: Mastering sorting algorithms is the foundation for efficient data processing and problem-solving in programming. A strong grasp of these concepts will make advanced topics much easier to learn.

Constraints:
- Each day must cover a unique subtopic or skill, building on previous days.
- Each day's response must be at least 400 words and rich in detail.
- Do NOT repeat the same content across days.
- Respond strictly with this structure. No intro or summary.
- Use clear, concise, and actionable language.
- Format links as: [Resource Name](URL)

Day 2:
...
(Start with Day 1 and end with Day ${days}. No markdown except for links.)`;

  let response;
  let schedule = [];
  let attempt = 0;
  let maxAttempts = 2;
  let hadEmptySubtask = false;
  while (attempt < maxAttempts) {
    attempt++;
    try {
      response = await generateMessageWithOpenRouter(prompt, 6000, 0.9); // More tokens, higher creativity
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
      // Extract fields based on new structure
      let dayTitle = (dayContent.match(/\u2728 Day Title:([\s\S]*?)(?=\n|$)/) || [])[1]?.trim() || '';
      let keyPoints = (dayContent.match(/\ud83d\udcda Key Points:[\s\S]*?(?=\n[\ud83d\udcdd\ud83d\udd17\ud83d\udcdd\ud83d\udd50\ud83e\udde0]|\n\uD83D\uDCDA|\n\uD83D\uDCDD|\n\uD83D\uDD17|\n\uD83D\uDD50|\n\uD83E\uDDE0|$)/) || [])[0]?.replace(/\ud83d\udcda Key Points:/, '').trim().split(/\n- /).filter(Boolean) || [];
      let example = (dayContent.match(/\ud83d\udcdd Example\/Analogy:([\s\S]*?)(?=\n|$)/) || [])[1]?.trim() || '';
      let resources = (dayContent.match(/\ud83d\udd17 Resources:[\s\S]*?(?=\n[\ud83d\udcdd\ud83d\udd50\ud83e\udde0]|\n\uD83D\uDCDD|\n\uD83D\uDD50|\n\uD83E\uDDE0|$)/) || [])[0]?.replace(/\ud83d\udd17 Resources:/, '').trim().split(/\n- /).filter(Boolean) || [];
      let tips = (dayContent.match(/\ud83d\udcdd Tips:([\s\S]*?)(?=\n|$)/) || [])[1]?.trim() || '';
      let duration = (dayContent.match(/\ud83d\udd50 Duration:([\s\S]*?)(?=\n|$)/) || [])[1]?.trim() || '';
      let motivation = (dayContent.match(/\ud83e\udde0 Motivation:([\s\S]*?)(?=\n|$)/) || [])[1]?.trim() || '';
      // Fallback for subtask if needed
      let subtask = dayTitle || (keyPoints.length ? keyPoints[0] : '') || '';
      if (!subtask) {
        // fallback: first non-empty line after Day N:
        const lines = dayContent.split('\n').map(l => l.trim()).filter(Boolean);
        subtask = lines[0] || '';
      }
      if (!subtask) {
        hadEmptySubtask = true;
        console.warn('AI schedule parsing: subtask is empty for day', dayNumber, 'raw dayContent:', dayContent);
      }
      const date = new Date(new Date(startDate).getTime() + (dayNumber - 1) * 24*60*60*1000);
      schedule.push({
        date,
        subtask,
        dayTitle,
        keyPoints,
        example,
        resources,
        tips,
        duration,
        motivation,
        day: dayNumber,
        status: 'pending',
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
    prompt = `Generate a ${days}-day plan for "${title}". For each day, use only these labels: Day N:, ✨ Day Title:, 📚 Key Points:, 📝 Example/Analogy:, 🔗 Resources:, 💡 Tips:, 🕐 Duration:, 🧠 Motivation:. Each day must be at least 200 words. No formatting, no extra text. Start with Day 1: and end with Day ${days}:.`;
  }
  if (hadEmptySubtask || schedule.length === 0) {
    console.error('AI schedule generation failed after retries. Raw response:', response);
    throw new Error('AI failed to generate a valid schedule. Please try again or rephrase your topic.');
  }
  return schedule;
}

// Simple implementation to avoid breaking notification flow
function splitContentIntoMessages(fullContent, topic, dayNumber) {
  // Split by sections if too long for Telegram (max ~4000 chars per message, but use 2000 for safety)
  const maxLen = 2000;
  if (fullContent.length <= maxLen) return [fullContent];

  // Try to split by Explanation, Example Code, Resources/Exercises/Notes
  const explanationMatch = fullContent.match(/(Explanation:([\s\S]*?))(Example Code:|Resources:|Exercises:|Notes:|$)/);
  const codeMatch = fullContent.match(/(Example Code:([\s\S]*?))(Resources:|Exercises:|Notes:|$)/);
  const restMatch = fullContent.match(/(Resources:([\s\S]*))/);

  let messages = [];
  if (explanationMatch) messages.push(explanationMatch[1].trim());
  if (codeMatch) messages.push(codeMatch[1].trim());
  if (restMatch) messages.push(restMatch[1].trim());

  // Fallback: if splitting fails, chunk by maxLen
  if (messages.length === 0) {
    for (let i = 0; i < fullContent.length; i += maxLen) {
      messages.push(fullContent.slice(i, i + maxLen));
    }
  }
  return messages;
}

// TEST SCRIPT: Run this file directly to test schedule generation and send to Telegram
if (require.main === module) {
  (async () => {
    const title = 'Sorting Algorithms';
    const requirements = 'Focus on practical coding, cover Bubble Sort, Selection Sort, Insertion Sort, and their time complexities. Include real-world analogies and at least 2 resources per day.';
    const startDate = new Date().toISOString().slice(0, 10);
    const endDate = new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10); // 3 days
    try {
      const schedule = await generateScheduleWithOpenRouter(title, requirements, startDate, endDate);
      console.log('\n===== AI Generated Schedule =====\n');
      schedule.forEach(day => {
        console.log(`Day ${day.day}:`);
        console.log('Day Title:', day.dayTitle);
        console.log('Key Points:', day.keyPoints);
        console.log('Example/Analogy:', day.example);
        console.log('Resources:', day.resources);
        console.log('Tips:', day.tips);
        console.log('Duration:', day.duration);
        console.log('Motivation:', day.motivation);
        console.log('---');
      });
      // Send to Telegram
      const telegram = new TelegramService();
      const chatId = '6644184480';
      for (const day of schedule) {
        let message =
          `\u2728 <b>Day ${day.day}: ${title}</b>\n` +
          (day.dayTitle ? `\n<b>Day Title:</b> ${day.dayTitle}` : '') +
          (day.keyPoints && day.keyPoints.length ? `\n<b>Key Points:</b>\n- ${day.keyPoints.join('\n- ')}` : '') +
          (day.example ? `\n<b>Example/Analogy:</b> ${day.example}` : '') +
          (day.resources && day.resources.length ? `\n<b>Resources:</b>\n- ${day.resources.join('\n- ')}` : '') +
          (day.tips ? `\n<b>Tips:</b> ${day.tips}` : '') +
          (day.duration ? `\n<b>Duration:</b> ${day.duration}` : '') +
          (day.motivation ? `\n<b>Motivation:</b> ${day.motivation}` : '');
        // Telegram API rate limit: add delay between messages
        await telegram.sendMessage(chatId, message);
        await new Promise(res => setTimeout(res, 1200));
      }
      console.log('Schedule sent to Telegram chat:', chatId);
    } catch (err) {
      console.error('Test failed:', err);
    }
  })();
}

module.exports = { 
  generateScheduleWithOpenRouter,
  splitContentIntoMessages,
}; 