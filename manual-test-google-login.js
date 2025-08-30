#!/usr/bin/env node

/**
 * Manual Google Login Test - Simple Node.js script to test backend and identify issues
 */

const http = require('http');
const https = require('https');

const TEST_CONFIG = {
  frontendUrl: 'http://localhost:5173',
  backendUrl: 'http://localhost:5001'
};

async function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    const req = client.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
  });
}

async function testBackendHealth() {
  console.log('🔍 Testing backend health...');
  try {
    const response = await makeRequest(`${TEST_CONFIG.backendUrl}/api/health`);
    console.log(`✅ Backend health: ${response.statusCode}`);
    console.log(`📄 Response: ${response.body}`);
    return response.statusCode === 200;
  } catch (error) {
    console.error(`❌ Backend health failed: ${error.message}`);
    return false;
  }
}

async function testFrontendHealth() {
  console.log('🔍 Testing frontend health...');
  try {
    const response = await makeRequest(TEST_CONFIG.frontendUrl);
    console.log(`✅ Frontend health: ${response.statusCode}`);
    return response.statusCode === 200;
  } catch (error) {
    console.error(`❌ Frontend health failed: ${error.message}`);
    return false;
  }
}

async function testAuthRoutes() {
  console.log('🔍 Testing auth routes...');
  try {
    // Test login route with dummy data
    const testData = JSON.stringify({
      firebaseUid: 'test123',
      email: 'test@example.com'
    });

    const response = await new Promise((resolve, reject) => {
      const req = http.request({
        hostname: 'localhost',
        port: 5001,
        path: '/api/auth/login',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(testData)
        }
      }, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({
          statusCode: res.statusCode,
          body: data
        }));
      });

      req.on('error', reject);
      req.write(testData);
      req.end();
    });

    console.log(`✅ Auth login route: ${response.statusCode}`);
    console.log(`📄 Response: ${response.body}`);
    return true;
  } catch (error) {
    console.error(`❌ Auth routes test failed: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Google Login Manual Tests...\n');
  
  const results = {
    backend: await testBackendHealth(),
    frontend: await testFrontendHealth(),
    authRoutes: await testAuthRoutes()
  };
  
  console.log('\n📊 Test Results:');
  console.log(`Backend Health: ${results.backend ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Frontend Health: ${results.frontend ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Auth Routes: ${results.authRoutes ? '✅ PASS' : '❌ FAIL'}`);
  
  if (!results.backend) {
    console.log('\n🔧 ISSUE: Backend is not running or not healthy');
    console.log('   Solution: Start backend with: cd Backend && npm start');
  }
  
  if (!results.frontend) {
    console.log('\n🔧 ISSUE: Frontend is not running or not accessible');
    console.log('   Solution: Start frontend with: cd Frontend/lifebuddy && npm run dev');
  }
  
  console.log('\n📋 Manual Test Instructions:');
  console.log('1. Open browser to http://localhost:5173/login');
  console.log('2. Open browser console (F12)');
  console.log('3. Click "Continue with Google" button');
  console.log('4. Look for these console logs:');
  console.log('   - 🖱️ Mouse down on Google button');
  console.log('   - 🖱️ Mouse up on Google button');
  console.log('   - 🔥 Google button clicked - event fired!');
  console.log('   - 🚀 Calling loginWithGoogle...');
  console.log('   - ✅ Backend switched to: Local (http://localhost:5001)');
  console.log('5. If no logs appear, the button click handler is not working');
  console.log('6. If logs appear but stop at a certain point, that\'s where the issue is');
}

runTests().catch(console.error);
