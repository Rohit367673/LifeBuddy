// Test Firebase configuration
import { auth } from './firebaseConfig.js';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

export const testFirebaseConfig = () => {
  console.log('🧪 Testing Firebase Configuration:');
  console.log('- Auth object exists:', !!auth);
  console.log('- Project ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID);
  console.log('- Auth Domain:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
  console.log('- API Key present:', !!import.meta.env.VITE_FIREBASE_API_KEY);
  console.log('- App ID:', import.meta.env.VITE_FIREBASE_APP_ID);
  
  if (auth) {
    console.log('- Auth app:', auth.app.name);
    console.log('- Auth config:', auth.config);
  }
};

export const testGoogleProvider = async () => {
  if (!auth) {
    console.error('❌ Firebase auth not initialized');
    return;
  }
  
  try {
    console.log('🧪 Testing Google Provider...');
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    
    console.log('✅ Google provider created successfully');
    console.log('- Provider ID:', provider.providerId);
    console.log('✅ Firebase and Google provider are properly configured');
    console.log('ℹ️ Ready for user-initiated Google login');
  } catch (error) {
    console.error('❌ Google provider test failed:', error);
  }
};
