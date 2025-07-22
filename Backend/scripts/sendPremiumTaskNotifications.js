const mongoose = require('mongoose');
const User = require('../models/User');
const PremiumTask = require('../models/PremiumTask');
const { MessagingService } = require('../services/messagingService');
const nodemailer = require('nodemailer');

require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/lifebuddy';

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const TEST_TO = EMAIL_USER; // Send to yourself for test

async function sendNotifications() {
  await mongoose.connect(MONGO_URI);

  // Find all users with an active premium task
  const users = await User.find({});

  for (const user of users) {
    const task = await PremiumTask.findOne({
      user: user._id,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    }).sort({ createdAt: -1 });

    if (!task) continue;

    // Find today's subtask
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const subtask = task.generatedSchedule.find(s => {
      const sd = new Date(s.date);
      sd.setHours(0, 0, 0, 0);
      return sd.getTime() === today.getTime();
    });

    if (subtask && subtask.status === 'pending') {
      // Send the daily schedule to the user's selected platform
      try {
        const messagingService = new MessagingService();
        // The day number is the subtask's day property, or its index+1
        const dayNumber = subtask.day || (task.generatedSchedule.findIndex(s => s === subtask) + 1);
        await messagingService.sendMessage(user, task, dayNumber);
        console.log(`Schedule sent to user ${user.email} on ${user.notificationPlatform || 'email'} for day ${dayNumber}`);
      } catch (err) {
        console.error('Send message error:', err);
      }
    }
  }

  await mongoose.disconnect();
}

async function sendTestEmail() {
  console.log('EMAIL_USER:', EMAIL_USER, 'EMAIL_PASS:', EMAIL_PASS ? 'SET' : 'NOT SET');
  if (!EMAIL_USER || !EMAIL_PASS) {
    console.error('❌ EMAIL_USER or EMAIL_PASS not set in environment variables.');
    return;
  }
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: EMAIL_USER,
      pass: EMAIL_PASS
    }
  });

  const mailOptions = {
    from: EMAIL_USER,
    to: TEST_TO,
    subject: 'LifeBuddy Test Email',
    text: 'This is a test email from your LifeBuddy backend.'
  };

  try {
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent:', result.messageId);
  } catch (error) {
    console.error('❌ Failed to send test email:', error);
  }
}

// Only run the test email, skip MongoDB logic for now
sendTestEmail(); 