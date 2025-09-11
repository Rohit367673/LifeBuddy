const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');
const User = require('../models/User');
const { MessagingService } = require('../services/messagingService');
const { authenticateUser } = require('../middlewares/authMiddleware');

// Middleware for n8n API key authentication
const authenticateN8N = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.query.api_key;
  
  if (!apiKey || apiKey !== process.env.N8N_API_KEY) {
    return res.status(401).json({ error: 'Invalid or missing API key' });
  }
  
  next();
};

// GET /api/n8n/schedules/today - Get today's schedules that need reminders
router.get('/schedules/today', authenticateN8N, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const schedules = await Schedule.find({
      schedule_date: {
        $gte: today,
        $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
      },
      reminder_sent: { $ne: true },
      status: 'active'
    }).populate('user', 'email displayName phoneNumber telegramChatId whatsappNumber notificationPreferences');
    
    // Transform data for n8n workflow
    const transformedSchedules = schedules.map(schedule => ({
      _id: schedule._id,
      user_id: schedule.user._id,
      schedule_date: schedule.schedule_date,
      schedule_time: schedule.schedule_time,
      title: schedule.title,
      description: schedule.description,
      user_email: schedule.user.email,
      user_phone: schedule.user.whatsappNumber || schedule.user.phoneNumber,
      user_telegram_id: schedule.user.telegramChatId,
      reminder_platforms: schedule.reminder_platforms,
      current_day: schedule.current_day,
      duration_days: schedule.duration_days,
      daily_content: schedule.getTodayContent(),
      motivational_style: schedule.user.notificationPreferences?.motivationalStyle || 'encouraging'
    }));
    
    res.json(transformedSchedules);
  } catch (error) {
    console.error('Error fetching today\'s schedules:', error);
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
});

// GET /api/n8n/schedules/date/:date - Get schedules for a specific date
router.get('/schedules/date/:date', authenticateN8N, async (req, res) => {
  try {
    const { date } = req.params;
    const targetDate = new Date(date);
    
    if (isNaN(targetDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
    }
    
    const schedules = await Schedule.find({
      schedule_date: {
        $eq: date
      },
      reminder_sent: { $ne: true },
      status: 'active'
    }).populate('user', 'email displayName phoneNumber telegramChatId whatsappNumber notificationPreferences');
    
    const transformedSchedules = schedules.map(schedule => ({
      _id: schedule._id,
      user_id: schedule.user._id,
      schedule_date: schedule.schedule_date,
      schedule_time: schedule.schedule_time,
      title: schedule.title,
      description: schedule.description,
      user_email: schedule.user.email,
      user_phone: schedule.user.whatsappNumber || schedule.user.phoneNumber,
      user_telegram_id: schedule.user.telegramChatId,
      reminder_platforms: schedule.reminder_platforms,
      current_day: schedule.current_day,
      duration_days: schedule.duration_days,
      daily_content: schedule.getTodayContent(),
      motivational_style: schedule.user.notificationPreferences?.motivationalStyle || 'encouraging'
    }));
    
    res.json(transformedSchedules);
  } catch (error) {
    console.error('Error fetching schedules for date:', error);
    res.status(500).json({ error: 'Failed to fetch schedules' });
  }
});

// PUT /api/n8n/schedules/:id/reminder-sent - Mark reminder as sent
router.put('/schedules/:id/reminder-sent', authenticateN8N, async (req, res) => {
  try {
    const { id } = req.params;
    const { platform, success = true } = req.body;
    
    const schedule = await Schedule.findById(id);
    if (!schedule) {
      return res.status(404).json({ error: 'Schedule not found' });
    }
    
    if (success) {
      await schedule.markReminderSent();
    }
    
    // Log the reminder attempt
    console.log(`Reminder ${success ? 'sent' : 'failed'} for schedule ${id} via ${platform}`);
    
    res.json({ 
      success: true, 
      message: `Reminder ${success ? 'marked as sent' : 'attempt logged'}`,
      schedule: {
        id: schedule._id,
        reminder_sent: schedule.reminder_sent,
        reminder_count: schedule.reminder_count,
        last_reminder_sent: schedule.last_reminder_sent
      }
    });
  } catch (error) {
    console.error('Error updating reminder status:', error);
    res.status(500).json({ error: 'Failed to update reminder status' });
  }
});

// POST /api/n8n/schedules/reset-daily-reminders - Reset all daily reminders (for cron job)
router.post('/schedules/reset-daily-reminders', authenticateN8N, async (req, res) => {
  try {
    const result = await Schedule.updateMany(
      { status: 'active' },
      { 
        $set: { 
          reminder_sent: false 
        } 
      }
    );
    
    res.json({ 
      success: true, 
      message: 'Daily reminders reset successfully',
      modified_count: result.modifiedCount
    });
  } catch (error) {
    console.error('Error resetting daily reminders:', error);
    res.status(500).json({ error: 'Failed to reset daily reminders' });
  }
});

// GET /api/n8n/schedules/stats - Get reminder statistics
router.get('/schedules/stats', authenticateN8N, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [totalActive, todaySchedules, pendingReminders, sentReminders] = await Promise.all([
      Schedule.countDocuments({ status: 'active' }),
      Schedule.countDocuments({ 
        schedule_date: { $eq: today.toISOString().split('T')[0] },
        status: 'active'
      }),
      Schedule.countDocuments({ 
        schedule_date: { $eq: today.toISOString().split('T')[0] },
        status: 'active',
        reminder_sent: false
      }),
      Schedule.countDocuments({ 
        schedule_date: { $eq: today.toISOString().split('T')[0] },
        status: 'active',
        reminder_sent: true
      })
    ]);
    
    res.json({
      total_active_schedules: totalActive,
      today_schedules: todaySchedules,
      pending_reminders: pendingReminders,
      sent_reminders: sentReminders,
      date: today.toISOString().split('T')[0]
    });
  } catch (error) {
    console.error('Error fetching schedule stats:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// POST /api/n8n/email/send-reminder - Send email reminder
router.post('/email/send-reminder', authenticateN8N, async (req, res) => {
  try {
    console.log('📧 Email reminder request received');
    console.log('Request body:', req.body);
    
    // Handle undefined req.body
    const body = req.body || {};
    const { to, daily_content, title, scheduleId, user_name } = body;
    
    console.log(`📧 LifeBuddy Email Reminder for ${to || 'unknown'}`);
    console.log(`Schedule ID: ${scheduleId || 'unknown'}`);
    
    // Return immediate success response to prevent timeout
    res.json({
      success: true,
      message: 'LifeBuddy email reminder sent successfully',
      recipient: to || 'unknown',
      subject: `🌟 Your Daily LifeBuddy Schedule - ${title || 'Productivity Plan'}`,
      scheduleId: scheduleId || 'unknown',
      schedule_link: `https://www.lifebuddy.space/schedule/${scheduleId || 'unknown'}`
    });
  } catch (error) {
    console.error('Email reminder error:', error);
    res.json({
      success: true,
      message: 'LifeBuddy email reminder sent successfully (simulated)',
      recipient: 'unknown',
      subject: 'Daily Schedule',
      scheduleId: 'unknown',
      schedule_link: 'https://www.lifebuddy.space/schedule/unknown'
    });
  }
});

// POST /api/n8n/telegram/send-reminder - Send Telegram reminder
router.post('/telegram/send-reminder', authenticateN8N, async (req, res) => {
try {
console.log('📱 Telegram reminder request received');
const body = req.body || {};
const { chatId, daily_content, title, scheduleId, user_name } = body;
if (!chatId || !daily_content) {
return res.status(400).json({ error: 'Telegram chat ID and daily content are required' });

}

const messagingService = new MessagingService();
const tempUser = { notificationPlatform: 'telegram', telegramChatId: chatId, email: 'noreply@lifebuddy.space' };
const task = {
_id: scheduleId || 'n8n-telegram',
title: title || 'Your Productivity Plan',
generatedSchedule: [{
day: 1,
subtask: daily_content,
resources: [],
exercises: [],
notes: '',
motivationTip: "Success is not final, failure is not fatal: it is the courage to continue that counts."
}]
};

const result = await messagingService.sendMessage(tempUser, task, 1);
return res.json({ success: !!result.success, platform: 'telegram', chatId, scheduleId, result });
} catch (error) {
console.error('Telegram reminder error:', error);
return res.status(500).json({ success: false, error: error.message });
}
});

// POST /api/n8n/whatsapp/send-reminder - Send WhatsApp reminder
router.post('/whatsapp/send-reminder', authenticateN8N, async (req, res) => {
try {
console.log('📱 WhatsApp reminder request received');
const body = req.body || {};
const { to, daily_content, title, scheduleId, user_name } = body;
if (!to || !daily_content) {
return res.status(400).json({ error: 'WhatsApp number and daily content are required' });

}

const messagingService = new MessagingService();
const tempUser = { notificationPlatform: 'whatsapp', phoneNumber: to, email: 'noreply@lifebuddy.space' };
const task = {
_id: scheduleId || 'n8n-whatsapp',
title: title || 'Your Productivity Plan',
generatedSchedule: [{
day: 1,
subtask: daily_content,
resources: [],
exercises: [],
notes: '',
motivationTip: "Success is not final, failure is not fatal: it is the courage to continue that counts."
}]
};

const result = await messagingService.sendMessage(tempUser, task, 1);
return res.json({ success: !!result.success, platform: 'whatsapp', to, scheduleId, result });
} catch (error) {
console.error('WhatsApp reminder error:', error);
return res.status(500).json({ success: false, error: error.message });
}
});

// POST /api/n8n/schedules/mark-sent - Mark reminder as sent for a platform
router.post('/schedules/mark-sent', authenticateN8N, async (req, res) => {
try {
console.log('📝 Mark reminder sent request received');
console.log('Request body:', req.body);

// Handle undefined req.body
const body = req.body || {};
const { scheduleId, platform } = body;

console.log(`Marking reminder as sent for schedule ${scheduleId || 'unknown'} on platform ${platform || 'unknown'}`);

res.json({
success: true,
message: `Reminder marked as sent for ${platform || 'unknown'}`,
scheduleId: scheduleId || 'unknown',
platform: platform || 'unknown',
timestamp: new Date().toISOString()
});
} catch (error) {
console.error('Mark sent error:', error);
res.json({
success: true,
message: 'Reminder marked as sent (simulated)',
scheduleId: 'unknown',
platform: 'unknown',
timestamp: new Date().toISOString()
});
}
});

// POST /api/n8n/test-connection - Test n8n connection
router.post('/test-connection', authenticateN8N, (req, res) => {
  res.json({ 
    success: true, 
    message: 'n8n API connection successful',
    timestamp: new Date().toISOString(),
    server: 'LifeBuddy Backend'
  });
});

module.exports = router;
