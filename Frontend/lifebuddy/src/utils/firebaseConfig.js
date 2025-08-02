import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';
import { getMessaging } from 'firebase/messaging';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
let app;
let auth;
let db;
let storage;
let messaging;
let analytics = null;

try {
  // Check if we have valid Firebase config (not placeholder values)
  const hasValidConfig = import.meta.env.VITE_FIREBASE_API_KEY && 
                        import.meta.env.VITE_FIREBASE_API_KEY !== 'your-actual-api-key-here' &&
                        import.meta.env.VITE_FIREBASE_PROJECT_ID &&
                        import.meta.env.VITE_FIREBASE_PROJECT_ID !== 'your-project-id';

  if (hasValidConfig) {
    // Initialize Firebase with minimal configuration to avoid 404 errors
    app = initializeApp(firebaseConfig);
    
    // Initialize services
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    messaging = getMessaging(app);
    
    // Initialize Analytics (only in production)
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
      try {
        analytics = getAnalytics(app);
      } catch (error) {
        // Analytics initialization failed silently
      }
    }
    
    console.log('✅ Firebase initialized successfully');
  } else {
    console.warn('⚠️ Firebase configuration is incomplete. Please update your .env file with valid Firebase project credentials.');
    console.warn('📝 Go to https://console.firebase.google.com/ to create a new project and get the configuration.');
    
    // Create null objects to prevent app crashes
    app = null;
    auth = null;
    db = null;
    storage = null;
    messaging = null;
  }
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
  console.error('Please check your Firebase configuration in .env file');
  
  // Create null objects to prevent app crashes
  app = null;
  auth = null;
  db = null;
  storage = null;
  messaging = null;
}

export { auth, db, storage, analytics, messaging };
export default app; 