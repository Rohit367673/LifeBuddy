console.log('RUNNING SCRIPT AT:', __filename, 'TIMESTAMP:', new Date().toISOString());

const path = require('path');
const envPath = path.resolve(__dirname, '../.env');
require('dotenv').config({ path: envPath });

const mongoose = require('mongoose');
const User = require('../models/User');
const { MessagingService } = require('../services/messagingService');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/lifebuddy';

async function sendDailyLessons() {
  await mongoose.connect(MONGO_URI);
  const users = await User.find({ aiSchedule: { $exists: true, $ne: [] } });
  const messagingService = new MessagingService();
  const today = new Date();

  for (const user of users) {
    // Track last sent day (default to 0)
    const lastSentDay = user.aiScheduleLastSentDay || 0;
    const schedule = user.aiSchedule || [];
    if (lastSentDay >= schedule.length) continue; // All days sent

    const lesson = schedule[lastSentDay];
    if (!lesson) continue;

    // Send lesson via preferred platform
    const message = `Day ${lesson.day}:\n${lesson.content}`;
    try {
      await messagingService.sendMessage(user, { title: 'AI Course', generatedSchedule: [lesson] }, lesson.day);
      console.log(`✅ Sent Day ${lesson.day} to ${user.email || user.username} via ${user.notificationPlatform}`);
      // Update last sent day
      user.aiScheduleLastSentDay = lastSentDay + 1;
      await user.save();
    } catch (err) {
      console.error(`❌ Failed to send to ${user.email || user.username}:`, err);
    }
  }
  await mongoose.disconnect();
}

sendDailyLessons(); 