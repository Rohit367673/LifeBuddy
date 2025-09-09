const mongoose = require('mongoose');
require('dotenv').config();

// Import models
const User = require('./models/User');
const Schedule = require('./models/Schedule');

async function createTestSchedule() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lifebuddy');
    console.log('Connected to MongoDB');

    // Find or create a test user
    let testUser = await User.findOne({ email: 'rohit367673@gmail.com' });
    
    if (!testUser) {
      console.log('Creating test user...');
      testUser = new User({
        displayName: 'Test User',
        username: 'testuser',
        email: 'rohit367673@gmail.com',
        whatsappNumber: '+918988140922',
        telegramChatId: '123456789',
        telegramUsername: 'testuser',
        notificationPreferences: {
          scheduleReminders: {
            enabled: true,
            platforms: ['email', 'whatsapp', 'telegram'],
            time: '09:00',
            timezone: 'Asia/Kolkata'
          }
        }
      });
      await testUser.save();
      console.log('Test user created');
    } else {
      console.log('Test user found');
    }

    // Create a test schedule for today
    const today = new Date();
    const scheduleDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    // Check if schedule already exists for today
    const existingSchedule = await Schedule.findOne({
      user: testUser._id,
      scheduleDate: scheduleDate
    });

    if (existingSchedule) {
      console.log('Test schedule already exists for today');
      console.log('Schedule ID:', existingSchedule._id);
      return;
    }

    const testSchedule = new Schedule({
      user: testUser._id,
      title: 'Daily Productivity Schedule',
      description: 'AI-generated daily schedule for maximum productivity',
      scheduleDate: scheduleDate,
      duration: 1, // 1 day
      reminderPlatforms: ['email', 'whatsapp', 'telegram'],
      dailySchedules: [{
        day: 1,
        date: scheduleDate,
        content: {
          morning: [
            { time: '06:00', task: 'Wake up and morning routine', duration: 30 },
            { time: '06:30', task: 'Exercise and meditation', duration: 60 },
            { time: '07:30', task: 'Healthy breakfast', duration: 30 }
          ],
          afternoon: [
            { time: '12:00', task: 'Lunch break', duration: 60 },
            { time: '13:00', task: 'Deep work session', duration: 120 },
            { time: '15:00', task: 'Team meetings', duration: 90 }
          ],
          evening: [
            { time: '18:00', task: 'Review daily progress', duration: 30 },
            { time: '18:30', task: 'Personal development', duration: 60 },
            { time: '19:30', task: 'Dinner and relaxation', duration: 90 }
          ]
        },
        completed: false
      }],
      reminderStatus: {
        email: { sent: false, sentAt: null },
        whatsapp: { sent: false, sentAt: null },
        telegram: { sent: false, sentAt: null }
      },
      aiMetadata: {
        model: 'gpt-4',
        prompt: 'Create a balanced daily schedule for maximum productivity',
        generatedAt: new Date()
      },
      userPreferences: {
        wakeUpTime: '06:00',
        sleepTime: '22:00',
        workStartTime: '09:00',
        workEndTime: '17:00',
        motivationalStyle: 'encouraging',
        focusAreas: ['productivity', 'health', 'learning']
      }
    });

    await testSchedule.save();
    console.log('✅ Test schedule created successfully!');
    console.log('Schedule ID:', testSchedule._id);
    console.log('User ID:', testUser._id);
    console.log('Schedule Date:', scheduleDate);
    
  } catch (error) {
    console.error('❌ Error creating test schedule:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  }
}

createTestSchedule();
