const axios = require('axios');

const API_BASE = 'http://localhost:5002';
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIzN2ZjOTU4OC01YWNlLTRkNjUtOTYzZS0wZTBiNzFkMjA3ZTMiLCJpc3MiOiJuOG4iLCJhdWQiOiJwdWJsaWMtYXBpIiwiaWF0IjoxNzU3MzM2NjEzfQ.Ieb9czhWybhL8s1EGa1sTG5VrJF9CbiuSSewspG7ywI';

async function testN8nWorkflow() {
  console.log('🚀 Testing n8n Workflow Integration\n');

  try {
    // Step 1: Test connection
    console.log('1. Testing n8n API connection...');
    const connectionTest = await axios.post(`${API_BASE}/api/n8n/test-connection`, {}, {
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Connection test:', connectionTest.data);

    // Step 2: Test fetching today's schedules
    console.log('\n2. Testing fetch today\'s schedules...');
    const schedulesResponse = await axios.get(`${API_BASE}/api/n8n/schedules/today`, {
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    console.log('📅 Schedules response:', schedulesResponse.data);

    // Step 3: Test email reminder endpoint
    console.log('\n3. Testing email reminder endpoint...');
    const emailTest = await axios.post(`${API_BASE}/api/n8n/email/send-reminder`, {
      to: 'rohit367673@gmail.com',
      subject: 'Test Schedule Reminder',
      message: 'This is a test reminder from the n8n workflow integration.',
      scheduleId: '507f1f77bcf86cd799439011'
    }, {
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    console.log('📧 Email test:', emailTest.data);

    // Step 4: Test WhatsApp reminder endpoint
    console.log('\n4. Testing WhatsApp reminder endpoint...');
    const whatsappTest = await axios.post(`${API_BASE}/api/n8n/whatsapp/send-reminder`, {
      to: '+918988140922',
      message: 'Test WhatsApp reminder from LifeBuddy n8n workflow! 🚀',
      scheduleId: '507f1f77bcf86cd799439011'
    }, {
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    console.log('📱 WhatsApp test:', whatsappTest.data);

    // Step 5: Test Telegram reminder endpoint
    console.log('\n5. Testing Telegram reminder endpoint...');
    const telegramTest = await axios.post(`${API_BASE}/api/n8n/telegram/send-reminder`, {
      chatId: '123456789',
      message: 'Test Telegram reminder from LifeBuddy n8n workflow! 🎯',
      scheduleId: '507f1f77bcf86cd799439011'
    }, {
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    console.log('💬 Telegram test:', telegramTest.data);

    // Step 6: Test mark reminder as sent
    console.log('\n6. Testing mark reminder as sent...');
    const markSentTest = await axios.post(`${API_BASE}/api/n8n/schedules/mark-sent`, {
      scheduleId: '507f1f77bcf86cd799439011',
      platform: 'email'
    }, {
      headers: {
        'x-api-key': API_KEY,
        'Content-Type': 'application/json'
      }
    });
    console.log('✅ Mark sent test:', markSentTest.data);

    console.log('\n🎉 All n8n API endpoints tested successfully!');
    console.log('\n📋 Summary:');
    console.log('- ✅ API Connection: Working');
    console.log('- ✅ Schedule Fetching: Working (returns empty when no DB)');
    console.log('- ✅ Email Reminders: Endpoint ready');
    console.log('- ✅ WhatsApp Reminders: Endpoint ready');
    console.log('- ✅ Telegram Reminders: Endpoint ready');
    console.log('- ✅ Reminder Tracking: Endpoint ready');
    console.log('\n🔧 Next Steps:');
    console.log('1. Import the corrected n8n workflow JSON');
    console.log('2. Configure credentials in n8n');
    console.log('3. Set up cron trigger for daily 9 AM execution');
    console.log('4. Test with real schedule data');

  } catch (error) {
    console.error('❌ Error testing n8n workflow:', error.response?.data || error.message);
  }
}

testN8nWorkflow();
