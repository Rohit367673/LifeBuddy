const axios = require('axios');

const API_URL = 'http://localhost:5000/api';

async function testBasicFunctionality() {
  console.log('🧪 Testing Basic Event Planner Functionality...\n');
  
  try {
    // Test 1: Check if server is running
    console.log('1. Testing server connectivity...');
    const healthResponse = await axios.get(`${API_URL}/health`);
    console.log('✅ Server is running');
    
    // Test 2: Check if templates endpoint exists
    console.log('\n2. Testing templates endpoint...');
    try {
      const templatesResponse = await axios.get(`${API_URL}/events/templates`);
      console.log('✅ Templates endpoint exists');
      console.log(`📋 Found ${templatesResponse.data.templates?.length || 0} templates`);
    } catch (error) {
      console.log('❌ Templates endpoint failed:', error.response?.status);
    }
    
    // Test 3: Check if events endpoint exists
    console.log('\n3. Testing events endpoint...');
    try {
      const eventsResponse = await axios.get(`${API_URL}/events`);
      console.log('✅ Events endpoint exists');
    } catch (error) {
      console.log('❌ Events endpoint failed:', error.response?.status);
    }
    
    // Test 4: Check if stats endpoint exists
    console.log('\n4. Testing stats endpoint...');
    try {
      const statsResponse = await axios.get(`${API_URL}/events/stats/overview`);
      console.log('✅ Stats endpoint exists');
    } catch (error) {
      console.log('❌ Stats endpoint failed:', error.response?.status);
    }
    
    console.log('\n✅ Basic functionality test completed!');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testBasicFunctionality(); 