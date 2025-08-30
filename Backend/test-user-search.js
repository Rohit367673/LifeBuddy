const mongoose = require('mongoose');
const User = require('./models/User');
const jwt = require('jsonwebtoken');
const axios = require('axios');
require('dotenv').config();

async function testUserSearch() {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/lifebuddy');
    
    const user = await User.findOne({ email: 'rohit367673@gmail.com' });
    if (!user) {
      console.log('❌ User not found');
      return;
    }
    
    console.log('✅ Found user:', user._id.toString());
    
    const payload = {
      userId: user._id.toString(),
      firebaseUid: user.firebaseUid,
      email: user.email
    };
    
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '1h' });
    console.log('✅ Generated test token');
    
    await mongoose.disconnect();
    
    // Test user search endpoint
    const response = await axios.get('http://localhost:5001/api/users/search?q=rohit', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ User search successful!');
    console.log('Search results:', response.data);
    
    // Test achievements endpoint
    try {
      const achievementsResponse = await axios.get('http://localhost:5001/api/achievements/recent/list', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Achievements endpoint working:', achievementsResponse.data);
    } catch (achError) {
      console.log('⚠️ Achievements endpoint response:', achError.response?.status, achError.response?.data);
    }
    
    // Test motivational endpoint
    try {
      const motivationalResponse = await axios.get('http://localhost:5001/api/motivational/random', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      console.log('✅ Motivational endpoint working:', motivationalResponse.data);
    } catch (motError) {
      console.log('⚠️ Motivational endpoint response:', motError.response?.status, motError.response?.data);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
  }
}

testUserSearch();
