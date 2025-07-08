import { auth } from './firebaseConfig';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

// Test Firebase configuration
export const testFirebaseConfig = () => {
  console.log('=== Firebase Configuration Test ===');
  console.log('Auth instance:', auth);
  console.log('Auth current user:', auth.currentUser);
  console.log('Auth config:', auth.config);
  console.log('Environment variables:');
  console.log('- VITE_FIREBASE_API_KEY:', import.meta.env.VITE_FIREBASE_API_KEY ? '***' + import.meta.env.VITE_FIREBASE_API_KEY.slice(-4) : 'undefined');
  console.log('- VITE_FIREBASE_AUTH_DOMAIN:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
  console.log('- VITE_FIREBASE_PROJECT_ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID);
  console.log('- VITE_API_URL:', import.meta.env.VITE_API_URL);
  console.log('=== End Test ===');
};

// Test Google authentication
export const testGoogleAuth = async () => {
  try {
    console.log('=== Testing Google Authentication ===');
    const provider = new GoogleAuthProvider();
    provider.addScope('email');
    provider.addScope('profile');
    
    console.log('Provider created:', provider);
    console.log('Attempting popup login...');
    
    const result = await signInWithPopup(auth, provider);
    console.log('Login successful:', result.user.email);
    return result;
  } catch (error) {
    console.error('Google auth test failed:', error);
    throw error;
  }
}; 