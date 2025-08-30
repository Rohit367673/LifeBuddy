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

// Resolve authDomain from env or from projectId as a safe fallback
const resolveAuthDomain = () => {
  const envDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN;
  const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
  const isPlaceholder = (v) => !v || /your[-_ ]firebase|your[-_ ]project/i.test(String(v));
  if (envDomain && !isPlaceholder(envDomain)) return envDomain;
  if (projectId && !isPlaceholder(projectId)) return `${projectId}.firebaseapp.com`;
  return null;
};

try {
  // Check if we have valid Firebase config (not placeholder values)
  const resolvedAuthDomain = resolveAuthDomain();
  const missing = [];
  if (!import.meta.env.VITE_FIREBASE_API_KEY || /your[-_ ]firebase/i.test(import.meta.env.VITE_FIREBASE_API_KEY)) missing.push('VITE_FIREBASE_API_KEY');
  if (!import.meta.env.VITE_FIREBASE_PROJECT_ID || /your[-_ ]firebase|your[-_ ]project/i.test(import.meta.env.VITE_FIREBASE_PROJECT_ID)) missing.push('VITE_FIREBASE_PROJECT_ID');
  if (!import.meta.env.VITE_FIREBASE_APP_ID || /your[-_ ]firebase|your[-_ ]app/i.test(import.meta.env.VITE_FIREBASE_APP_ID)) missing.push('VITE_FIREBASE_APP_ID');
  if (!resolvedAuthDomain) missing.push('VITE_FIREBASE_AUTH_DOMAIN');

  const hasValidConfig = missing.length === 0;

  if (hasValidConfig) {
    // Initialize Firebase with resolved configuration
    const effectiveConfig = {
      ...firebaseConfig,
      authDomain: resolvedAuthDomain
    };
    app = initializeApp(effectiveConfig);
    
    // Initialize services
    auth = getAuth(app);
    db = getFirestore(app);
    storage = getStorage(app);
    
    // Initialize messaging only if supported
    try {
      messaging = getMessaging(app);
    } catch (messagingError) {
      console.warn('⚠️ Firebase Messaging not supported in this environment');
      messaging = null;
    }
    
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
    console.warn('⚠️ Firebase configuration is incomplete. Missing:', missing.join(', '));
    console.warn('📝 Update Frontend/lifebuddy/.env (or .env.local) with your Firebase Web App config from the Firebase Console.');
    
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