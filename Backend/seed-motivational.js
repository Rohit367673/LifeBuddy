const mongoose = require('mongoose');
const MotivationalMessage = require('./models/MotivationalMessage');
require('dotenv').config();

async function seedMotivationalMessages() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lifebuddy');
    
    const messages = [
      {
        content: 'Stay motivated and keep pushing forward!',
        category: 'motivation',
        context: 'general',
        tags: ['motivation', 'perseverance'],
        isActive: true
      },
      {
        content: 'Every small step counts towards your bigger goals.',
        category: 'success',
        context: 'afternoon',
        tags: ['success', 'progress'],
        isActive: true
      },
      {
        content: 'You have the power to make today amazing!',
        category: 'inspiration',
        context: 'morning',
        tags: ['inspiration', 'positivity'],
        isActive: true
      },
      {
        content: 'Believe in yourself and all that you are.',
        category: 'motivation',
        context: 'evening',
        tags: ['motivation', 'self-belief'],
        isActive: true
      },
      {
        content: 'Progress, not perfection, is the goal.',
        category: 'growth',
        context: 'general',
        tags: ['growth', 'progress'],
        isActive: true
      }
    ];
    
    await MotivationalMessage.deleteMany({});
    await MotivationalMessage.insertMany(messages);
    
    console.log('✅ Seeded', messages.length, 'motivational messages');
    await mongoose.disconnect();
  } catch (error) {
    console.error('Error:', error.message);
  }
}

seedMotivationalMessages();
