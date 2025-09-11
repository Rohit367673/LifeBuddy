const mongoose = require('mongoose');
const User = require('./models/User');
const PremiumTask = require('./models/PremiumTask');
const fetch = require('node-fetch');
require('dotenv').config();

// Test script to verify WAHA WhatsApp messaging
async function testWAHAWhatsApp() {
  try {
    console.log('🚀 Starting WAHA WhatsApp test...');
    
    // Test WAHA API availability
    console.log('🔍 Checking WAHA API availability...');
    try {
      const healthResponse = await fetch('http://localhost:3000/api/health');
      if (healthResponse.ok) {
        console.log('✅ WAHA API is running on localhost:3000');
      } else {
        console.log('❌ WAHA API health check failed');
      }
    } catch (error) {
      console.log('❌ WAHA API not accessible:', error.message);
      console.log('💡 Please start WAHA container first:');
      console.log('   docker-compose -f docker-compose.waha.yml up -d');
      console.log('   OR install Docker and try again');
      return;
    }

    // Test WhatsApp session status
    console.log('📱 Checking WhatsApp session status...');
    try {
      const sessionResponse = await fetch('http://localhost:3000/api/sessions', {
        headers: {
          'X-API-Key': 'your-secret-key-321'
        }
      });
      
      if (sessionResponse.ok) {
        const sessions = await sessionResponse.json();
        console.log('📋 Available sessions:', sessions);
        
        const lifeBuddySession = sessions.find(s => s.name === 'lifebuddy');
        if (lifeBuddySession) {
          console.log('✅ LifeBuddy session found:', lifeBuddySession.status);
          if (lifeBuddySession.status !== 'WORKING') {
            console.log('⚠️ Session not working. Please scan QR code at http://localhost:3000/dashboard/');
          }
        } else {
          console.log('⚠️ LifeBuddy session not found. Please create session at http://localhost:3000/dashboard/');
        }
      }
    } catch (error) {
      console.log('❌ Session check failed:', error.message);
    }

    // Connect to MongoDB and get test user
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lifebuddy', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Connected to MongoDB');

    // Find test user
    let testUser = await User.findOne({ phoneNumber: '+917807932322' });
    if (!testUser) {
      console.log('❌ Test user with phone +917807932322 not found');
      console.log('💡 Run test-schedule-generation.js first to create test user');
      return;
    }
    console.log('✅ Found test user:', testUser.email);

    // Send test WhatsApp message
    console.log('📱 Sending test WhatsApp message...');
    const testMessage = {
      session: 'lifebuddy',
      chatId: '917807932322@c.us',
      text: `🚀 *LifeBuddy Test Message*

Good ${new Date().getHours() < 12 ? 'morning' : 'afternoon'}! 🌅

This is a test message from your LifeBuddy AI assistant.

*Test Details:*
- Time: ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
- User: ${testUser.displayName}
- Phone: ${testUser.phoneNumber}

💪 *System Status:*
✅ Backend: Connected
✅ Database: Connected  
✅ WAHA API: Running
✅ WhatsApp: Testing...

🔗 Dashboard: http://localhost:3000/dashboard/

Powered by *LifeBuddy* - Your AI Productivity Partner 🤖`
    };

    try {
      const response = await fetch('http://localhost:3000/api/sendText', {
        method: 'POST',
        headers: {
          'X-API-Key': 'your-secret-key-321',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testMessage)
      });

      const result = await response.json();
      
      if (response.ok) {
        console.log('✅ WhatsApp message sent successfully!');
        console.log('📋 Message ID:', result.id || 'N/A');
        console.log('📱 Check your WhatsApp (+917807932322) for the test message');
      } else {
        console.log('❌ WhatsApp message failed:', result);
        if (result.error && result.error.includes('session')) {
          console.log('💡 Please ensure WhatsApp session is active at http://localhost:3000/dashboard/');
        }
      }
    } catch (error) {
      console.log('❌ WhatsApp API error:', error.message);
    }

    // Test n8n workflow simulation
    console.log('🔄 Testing n8n workflow simulation...');
    const mockScheduleData = {
      _id: testUser._id,
      user_id: testUser._id,
      user_email: testUser.email,
      user_phone: testUser.phoneNumber,
      user_name: testUser.displayName,
      title: 'Learn JavaScript Programming',
      daily_content: 'Day 1: JavaScript Basics - Variables and Data Types',
      reminder_platforms: ['whatsapp'],
      whatsapp_chat_id: '917807932322@c.us'
    };

    console.log('📋 Mock workflow data:', {
      user: mockScheduleData.user_name,
      phone: mockScheduleData.user_phone,
      chatId: mockScheduleData.whatsapp_chat_id,
      platforms: mockScheduleData.reminder_platforms
    });

    console.log('\n📊 TEST RESULTS:');
    console.log('================');
    console.log('WAHA API: Available at localhost:3000');
    console.log('WhatsApp Number: +917807932322');
    console.log('Chat ID Format: 917807932322@c.us');
    console.log('Session Name: lifebuddy');
    console.log('API Key: your-secret-key-321');
    console.log('\n🎉 Test completed! Check WhatsApp for message delivery.');
    console.log('💡 Next: Import IMPROVED_N8N_WAHA_WORKFLOW.json into n8n');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.disconnect();
    console.log('📤 Disconnected from MongoDB');
  }
}

// Run the test
if (require.main === module) {
  testWAHAWhatsApp();
}

module.exports = { testWAHAWhatsApp };
