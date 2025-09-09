const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');
const User = require('../models/User');
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
        $eq: today.toISOString().split('T')[0]
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
    const { to, subject, message, scheduleId } = req.body;
    
    if (!to || !subject || !message) {
      return res.status(400).json({ error: 'Email recipient, subject, and message are required' });
    }
    
    // For now, log the email (you can integrate with SMTP later)
    console.log(`Email Reminder to ${to}:`, { subject, message });
    
    // Simulate successful send
    res.json({
      success: true,
      message: 'Email reminder sent successfully',
      recipient: to,
      scheduleId
    });
  } catch (error) {
    console.error('Email reminder error:', error);
    res.status(500).json({ error: 'Failed to send email reminder' });
  }
});

// POST /api/n8n/telegram/send-reminder - Send Telegram reminder
router.post('/telegram/send-reminder', authenticateN8N, async (req, res) => {
  try {
    const { chatId, message, scheduleId } = req.body;
    
    if (!chatId || !message) {
      return res.status(400).json({ error: 'Telegram chat ID and message are required' });
    }
    
    // For now, log the message (you can integrate with Telegram Bot API later)
    console.log(`Telegram Reminder to ${chatId}:`, message);
    
    // Simulate successful send
    res.json({
      success: true,
      message: 'Telegram reminder sent successfully',
      chatId,
      scheduleId
    });
  } catch (error) {
    console.error('Telegram reminder error:', error);
    res.status(500).json({ error: 'Failed to send Telegram reminder' });
  }
});

// POST /api/n8n/whatsapp/send-reminder - Send WhatsApp reminder via business API
router.post('/whatsapp/send-reminder', authenticateN8N, async (req, res) => {
  try {
    const { 
      to,
      message, 
      scheduleId,
      business_whatsapp = process.env.BUSINESS_WHATSAPP_NUMBER 
    } = req.body;
    
    if (!to || !message) {
      return res.status(400).json({ error: 'WhatsApp number and message are required' });
    }
    
    // For now, log the message (you can integrate with WhatsApp Business API later)
    console.log(`WhatsApp Reminder to ${to}:`, message);
    
    // Simulate successful send
    res.json({
      success: true,
      message: 'WhatsApp reminder sent successfully',
      recipient: to,
      scheduleId
    });
  } catch (error) {
    console.error('WhatsApp reminder error:', error);
    res.status(500).json({ error: 'Failed to send WhatsApp reminder' });
  }
});

// POST /api/n8n/schedules/mark-sent - Mark reminder as sent for a platform
router.post('/schedules/mark-sent', authenticateN8N, async (req, res) => {
  try {
    const { scheduleId, platform } = req.body;
    
    if (!scheduleId || !platform) {
      return res.status(400).json({ error: 'Schedule ID and platform are required' });
    }
    
    // For now, log the action (you can update database when connected)
    console.log(`Marking reminder as sent for schedule ${scheduleId} on platform ${platform}`);
    
    res.json({
      success: true,
      message: `Reminder marked as sent for ${platform}`,
      scheduleId,
      platform,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Mark sent error:', error);
    res.status(500).json({ error: 'Failed to mark reminder as sent' });
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
