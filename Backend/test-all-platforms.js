#!/usr/bin/env node

const axios = require('axios');

// Test configuration
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzN2ZjOTU4OC01YWNlLTRkNjUtOTYzZS0wZTBiNzFkMjA3ZTMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU3MzM2NjEzfQ.Ieb9czhWybhL8s1EGa1sTG5VrJF9CbiuSSewspG7ywI';
const BASE_URL = 'https://lifebuddy-backend-production.up.railway.app';

const testData = {
  email: 'rohit367673@gmail.com',
  telegramId: '6644184480',
  whatsappPhone: '+917807932322',
  testContent: {
    title: 'LifeBuddy Test Schedule',
    daily_content: `🌅 **Morning Routine (9:00 AM)**
• Review daily goals and priorities
• Check calendar and important tasks

⚡ **Deep Work Session (10:00 AM - 12:00 PM)**  
• Focus on most important project
• Eliminate distractions, use Pomodoro technique

🍽️ **Lunch Break (12:00 PM - 1:30 PM)**
• Healthy meal and short walk
• Mental reset and recharge

💪 **Today's Motivation:**
"Success is not final, failure is not fatal: it is the courage to continue that counts. Make today count with your LifeBuddy schedule!"`,
    scheduleId: 'test-' + Date.now(),
    user_name: 'Rohit'
  }
};

async function testEmail() {
  console.log('\n🔥 Testing Email Reminder...');
  try {
    const response = await axios.post(`${BASE_URL}/api/n8n/email/send-reminder`, {
      to: testData.email,
      daily_content: testData.testContent.daily_content,
      title: testData.testContent.title,
      scheduleId: testData.testContent.scheduleId,
      user_name: testData.testContent.user_name
    }, {
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('✅ Email Test Result:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.log('❌ Email Test Failed:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
}

async function testTelegram() {
  console.log('\n📱 Testing Telegram Reminder...');
  try {
    const response = await axios.post(`${BASE_URL}/api/n8n/telegram/send-reminder`, {
      chatId: testData.telegramId,
      daily_content: testData.testContent.daily_content,
      title: testData.testContent.title,
      scheduleId: testData.testContent.scheduleId,
      user_name: testData.testContent.user_name
    }, {
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('✅ Telegram Test Result:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.log('❌ Telegram Test Failed:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
}

async function testWhatsApp() {
  console.log('\n💬 Testing WhatsApp Reminder...');
  try {
    const response = await axios.post(`${BASE_URL}/api/n8n/whatsapp/send-reminder`, {
      to: testData.whatsappPhone,
      daily_content: testData.testContent.daily_content,
      title: testData.testContent.title,
      scheduleId: testData.testContent.scheduleId,
      user_name: testData.testContent.user_name
    }, {
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    console.log('✅ WhatsApp Test Result:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.log('❌ WhatsApp Test Failed:', error.response?.data || error.message);
    return { success: false, error: error.message };
  }
}

async function testWAHA() {
  console.log('\n🔄 Testing WAHA WhatsApp (if available)...');
  try {
    const response = await axios.post('http://localhost:3000/api/sendText', {
      session: 'default',
      chatId: testData.whatsappPhone + '@c.us',
      text: `🚀 *LifeBuddy Test Message*

Good morning, ${testData.testContent.user_name}! 🌅

*${testData.testContent.title}*

${testData.testContent.daily_content}

🔗 View Full Schedule: https://www.lifebuddy.space/schedule/${testData.testContent.scheduleId}

Powered by *LifeBuddy* - Your AI Productivity Partner 🤖`
    }, {
      headers: {
        'X-API-Key': 'your-secret-key-321',
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });

    console.log('✅ WAHA Test Result:', response.data);
    return { success: true, data: response.data };
  } catch (error) {
    console.log('⚠️ WAHA Test Skipped (container not running):', error.code);
    return { success: false, error: 'WAHA container not available', skipped: true };
  }
}

async function runAllTests() {
  console.log('🚀 LifeBuddy Platform Test Suite');
  console.log('=====================================');
  console.log(`📧 Email: ${testData.email}`);
  console.log(`📱 Telegram: ${testData.telegramId}`);
  console.log(`💬 WhatsApp: ${testData.whatsappPhone}`);
  console.log('=====================================');

  const results = {
    email: await testEmail(),
    telegram: await testTelegram(),
    whatsapp: await testWhatsApp(),
    waha: await testWAHA()
  };

  console.log('\n📊 Test Summary:');
  console.log('=====================================');
  console.log(`📧 Email: ${results.email.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`📱 Telegram: ${results.telegram.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`💬 WhatsApp (Backend): ${results.whatsapp.success ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`🔄 WhatsApp (WAHA): ${results.waha.success ? '✅ PASS' : results.waha.skipped ? '⚠️ SKIPPED' : '❌ FAIL'}`);

  const passCount = Object.values(results).filter(r => r.success).length;
  const totalTests = Object.values(results).filter(r => !r.skipped).length;
  
  console.log(`\n🎯 Overall: ${passCount}/${totalTests} tests passed`);
  
  if (passCount === totalTests) {
    console.log('🎉 All available platforms are working!');
  } else {
    console.log('⚠️ Some platforms need attention.');
  }

  return results;
}

// Run tests
runAllTests().catch(console.error);
