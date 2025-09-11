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
      user_email: testUser.email,
      user_phone: testUser.phoneNumber || '',
      user_telegram_id: testUser.telegramChatId || '',
      title: 'Daily Productivity Schedule',
      description: 'AI-generated schedule for maximum productivity',
      schedule_date: new Date(new Date().setHours(0, 0, 0, 0)),
      duration_days: 1,
      reminder_platforms: ['email', 'whatsapp'],
      daily_schedules: [{
        day: 1,
        content: `🌅 **Morning Routine (9:00 AM)**
• Review daily goals and priorities
• Check calendar and important tasks

⚡ **Deep Work Session 1 (10:00 AM - 12:00 PM)**  
• Focus on most important project
• Eliminate distractions, use Pomodoro technique

🍽️ **Lunch Break (12:00 PM - 1:30 PM)**
• Healthy meal and short walk
• Mental reset and recharge

⚡ **Deep Work Session 2 (1:30 PM - 3:30 PM)**
• Continue important projects
• Review progress and adjust priorities

💬 **Communication Time (3:30 PM - 5:00 PM)**
• Handle emails and messages
• Team meetings and collaboration

📋 **Daily Review (5:00 PM)**
• Review accomplishments
• Plan tomorrow's priorities
• Celebrate progress made

🔗 **View Full Schedule**: https://www.lifebuddy.space/schedule/{{scheduleId}}`,
        tasks: [
          'Morning Planning & Goal Setting',
          'Deep Work Session 1', 
          'Lunch Break',
          'Deep Work Session 2',
          'Communication & Meetings',
          'Review & Planning'
        ],
        completed: false
      }],
      original_prompt: 'Create a balanced daily schedule for maximum productivity',
      ai_model_used: 'openrouter',
      preferences: {
        reminder_time: '09:00',
        timezone: 'UTC',
        motivational_style: 'encouraging'
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
