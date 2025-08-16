#!/usr/bin/env node

/**
 * Google Login Diagnostic Script for LifeBuddy
 * This script will help identify and fix Google authentication issues
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 LifeBuddy Google Login Diagnostic Tool\n');

// Check if .env file exists and has Firebase config
function checkFirebaseConfig() {
  console.log('📋 Checking Firebase Configuration...');
  
  const envPath = path.join(__dirname, 'Frontend/lifebuddy/.env');
  const envLocalPath = path.join(__dirname, 'Frontend/lifebuddy/.env.local');
  
  let envFile = null;
  if (fs.existsSync(envPath)) {
    envFile = envPath;
  } else if (fs.existsSync(envLocalPath)) {
    envFile = envLocalPath;
  }
  
  if (!envFile) {
    console.log('❌ No .env file found in Frontend/lifebuddy/');
    console.log('📝 Create a .env file with your Firebase configuration');
    return false;
  }
  
  const envContent = fs.readFileSync(envFile, 'utf8');
  const requiredVars = [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN', 
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_APP_ID'
  ];
  
  const missing = [];
  const placeholder = [];
  
  requiredVars.forEach(varName => {
    const match = envContent.match(new RegExp(`${varName}=(.+)`));
    if (!match) {
      missing.push(varName);
    } else {
      const value = match[1].trim();
      if (!value || value.includes('your_firebase') || value.includes('your_project')) {
        placeholder.push(varName);
      }
    }
  });
  
  if (missing.length > 0) {
    console.log('❌ Missing Firebase environment variables:');
    missing.forEach(v => console.log(`   - ${v}`));
  }
  
  if (placeholder.length > 0) {
    console.log('⚠️  Firebase environment variables with placeholder values:');
    placeholder.forEach(v => console.log(`   - ${v}`));
  }
  
  if (missing.length === 0 && placeholder.length === 0) {
    console.log('✅ Firebase configuration looks good');
    return true;
  }
  
  return false;
}

// Check package.json for Firebase dependencies
function checkDependencies() {
  console.log('\n📦 Checking Firebase Dependencies...');
  
  const packagePath = path.join(__dirname, 'Frontend/lifebuddy/package.json');
  if (!fs.existsSync(packagePath)) {
    console.log('❌ package.json not found');
    return false;
  }
  
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
  
  const requiredDeps = ['firebase'];
  const missing = requiredDeps.filter(dep => !deps[dep]);
  
  if (missing.length > 0) {
    console.log('❌ Missing Firebase dependencies:');
    missing.forEach(dep => console.log(`   - ${dep}`));
    return false;
  }
  
  console.log('✅ Firebase dependencies installed');
  console.log(`   - firebase: ${deps.firebase}`);
  return true;
}

// Generate Firebase configuration template
function generateFirebaseConfigTemplate() {
  console.log('\n📝 Generating Firebase Configuration Template...');
  
  const template = `# Firebase Configuration
# Get these values from Firebase Console > Project Settings > General > Your apps > Web app
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id_here
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id_here
VITE_FIREBASE_APP_ID=your_app_id_here
VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id_here

# Backend API URL
VITE_API_URL=http://localhost:5001

# Telegram
VITE_TELEGRAM_BOT_USERNAME=lifebuddy_AI_bot
`;

  const envPath = path.join(__dirname, 'Frontend/lifebuddy/.env.template');
  fs.writeFileSync(envPath, template);
  console.log(`✅ Template created at: ${envPath}`);
}

// Check Firebase project setup requirements
function printFirebaseSetupInstructions() {
  console.log('\n🔧 Firebase Project Setup Instructions:');
  console.log('');
  console.log('1. Go to Firebase Console: https://console.firebase.google.com/');
  console.log('2. Select your project or create a new one');
  console.log('3. Enable Authentication:');
  console.log('   - Go to Authentication > Sign-in method');
  console.log('   - Enable Google provider');
  console.log('   - Add your domain to authorized domains');
  console.log('');
  console.log('4. Add authorized domains:');
  console.log('   - localhost (for development)');
  console.log('   - 127.0.0.1 (for development)');
  console.log('   - your-production-domain.com');
  console.log('');
  console.log('5. Get Web App Config:');
  console.log('   - Go to Project Settings > General');
  console.log('   - Scroll to "Your apps" section');
  console.log('   - Click on your web app or create one');
  console.log('   - Copy the config values to your .env file');
}

// Main diagnostic function
function runDiagnostic() {
  const configOk = checkFirebaseConfig();
  const depsOk = checkDependencies();
  
  if (!configOk || !depsOk) {
    generateFirebaseConfigTemplate();
    printFirebaseSetupInstructions();
    
    console.log('\n🚨 Issues Found:');
    if (!configOk) {
      console.log('   - Firebase configuration incomplete');
    }
    if (!depsOk) {
      console.log('   - Missing Firebase dependencies');
    }
    
    console.log('\n💡 Next Steps:');
    console.log('1. Update your .env file with real Firebase config values');
    console.log('2. Ensure Google provider is enabled in Firebase Console');
    console.log('3. Add localhost and your domain to authorized domains');
    console.log('4. Restart your development server');
    
    return false;
  }
  
  console.log('\n✅ All checks passed! Google login should work.');
  console.log('\nIf you\'re still having issues, check:');
  console.log('- Browser console for specific error messages');
  console.log('- Firebase Console > Authentication > Users for failed attempts');
  console.log('- Network tab for failed API requests');
  
  return true;
}

// Run the diagnostic
runDiagnostic();
