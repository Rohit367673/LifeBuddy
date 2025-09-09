const { generateMessageWithOpenRouter } = require('../services/openRouterService');
const User = require('../models/User');
const Schedule = require('../models/Schedule');
const mongoose = require('mongoose');

// POST /api/schedule - Enhanced schedule generation for n8n integration
exports.generateScheduleForUser = async (req, res) => {
  try {
    const userId = req.user._id;
    const { 
      title, 
      prompt, 
      duration_days = 7, 
      reminder_platforms = ['email'],
      schedule_time = '09:00'
    } = req.body;
    
    if (!title || !prompt) {
      return res.status(400).json({ error: 'Title and prompt are required.' });
    }

    if (duration_days < 1 || duration_days > 365) {
      return res.status(400).json({ error: 'Duration must be between 1 and 365 days.' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    // Enhanced AI prompt for multi-day schedule generation
    const aiPrompt = `You are an expert life coach and productivity specialist. Generate a detailed ${duration_days}-day schedule for the following request:

"${prompt}"

Requirements:
1. Create exactly ${duration_days} days of content
2. Each day should be practical and actionable
3. Include specific tasks, timeframes, and goals
4. Make it progressive - each day should build on the previous
5. Keep each day's content concise but comprehensive (200-300 words max)
6. Include motivational elements and tips

Format your response as a JSON array with this structure:
[
  {
    "day": 1,
    "content": "Day 1 detailed schedule and tasks...",
    "tasks": ["Task 1", "Task 2", "Task 3"]
  },
  {
    "day": 2,
    "content": "Day 2 detailed schedule and tasks...",
    "tasks": ["Task 1", "Task 2", "Task 3"]
  }
  // ... continue for all ${duration_days} days
]

Ensure the JSON is valid and complete.`;

    const startTime = Date.now();
    const aiResponse = await generateMessageWithOpenRouter(aiPrompt, 2000);
    const generationTime = Date.now() - startTime;
    
    console.log('Raw AI Response:', aiResponse);
    if (!aiResponse) {
      return res.status(500).json({ error: 'AI did not return a response.' });
    }

    // Parse AI response as JSON
    let dailySchedules;
    try {
      // Clean the response to extract JSON
      const jsonMatch = aiResponse.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }
      dailySchedules = JSON.parse(jsonMatch[0]);
      
      // Validate the structure
      if (!Array.isArray(dailySchedules) || dailySchedules.length !== duration_days) {
        throw new Error('Invalid schedule structure');
      }
    } catch (parseError) {
      console.error('Failed to parse AI response as JSON:', parseError);
      // Fallback: create a simple schedule structure
      dailySchedules = [{ 
        day: 1, 
        content: aiResponse.trim(),
        tasks: ['Review the schedule', 'Plan your day', 'Get started']
      }];
    }

    // Create new schedule document
    const schedule = new Schedule({
      user: userId,
      title: title.trim(),
      description: prompt.trim(),
      schedule_date: new Date(),
      schedule_time,
      duration_days,
      current_day: 1,
      user_email: user.email,
      user_phone: user.whatsappNumber || user.phoneNumber || '',
      user_telegram_id: user.telegramChatId || '',
      reminder_platforms,
      daily_schedules: dailySchedules,
      original_prompt: prompt,
      ai_model_used: 'openrouter',
      generation_metadata: {
        generation_time: generationTime,
        total_tokens: aiResponse.length,
        model_name: 'openrouter'
      },
      preferences: {
        reminder_time: schedule_time,
        timezone: user.preferences?.timezone || 'UTC',
        motivational_style: user.notificationPreferences?.motivationalStyle || 'encouraging'
      }
    });

    await schedule.save();

    // Update user's legacy aiSchedule field for backward compatibility
    await User.findByIdAndUpdate(userId, { 
      $set: { 
        aiSchedule: dailySchedules,
        aiScheduleLastSentDay: 0 
      } 
    });

    res.json({ 
      success: true,
      schedule: {
        id: schedule._id,
        title: schedule.title,
        duration_days: schedule.duration_days,
        daily_schedules: schedule.daily_schedules,
        reminder_platforms: schedule.reminder_platforms,
        schedule_time: schedule.schedule_time
      }
    });
  } catch (error) {
    console.error('Schedule generation error:', error);
    res.status(500).json({ error: 'Failed to generate schedule.' });
  }
};

// GET /api/schedule/user/:userId - Get user's active schedules
exports.getUserSchedules = async (req, res) => {
  try {
    const userId = req.user._id;
    
    const schedules = await Schedule.find({ 
      user: userId,
      status: 'active'
    }).sort({ createdAt: -1 });

    res.json({ schedules });
  } catch (error) {
    console.error('Error fetching user schedules:', error);
    res.status(500).json({ error: 'Failed to fetch schedules.' });
  }
};

// PUT /api/schedule/:id/complete-day - Mark current day as completed
exports.completeScheduleDay = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    
    const schedule = await Schedule.findOne({ _id: id, user: userId });
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found.' });
    }

    // Find current day and mark as completed
    const currentDay = schedule.daily_schedules.find(day => day.day === schedule.current_day);
    if (currentDay) {
      currentDay.completed = true;
      currentDay.completed_at = new Date();
    }

    // Move to next day or complete schedule
    if (schedule.current_day < schedule.duration_days) {
      schedule.current_day += 1;
    } else {
      schedule.status = 'completed';
    }

    await schedule.save();

    res.json({ 
      success: true,
      schedule: {
        id: schedule._id,
        current_day: schedule.current_day,
        status: schedule.status,
        completed_day: currentDay?.day
      }
    });
  } catch (error) {
    console.error('Error completing schedule day:', error);
    res.status(500).json({ error: 'Failed to complete schedule day.' });
  }
}; 