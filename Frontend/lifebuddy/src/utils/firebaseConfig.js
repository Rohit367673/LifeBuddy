import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Validate required environment variables
const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_APP_ID'
];

const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName]);
if (missingVars.length > 0) {
  console.error('Missing required Firebase environment variables:', missingVars);
  throw new Error(`Missing required Firebase environment variables: ${missingVars.join(', ')}`);
}

// Initialize Firebase with explicit config to prevent auto-configuration
// This prevents the 404 error for /__/firebase/init.json
let app;
try {
  app = initializeApp(firebaseConfig, {
    name: 'lifebuddy-app',
    automaticDataCollectionEnabled: false
  });
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw error;
}

let auth;
let db;
let storage;

try {
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} catch (error) {
  console.error('Firebase services initialization error:', error);
  throw error;
}

// Initialize Analytics (only in production to avoid errors in development)
let analytics = null;
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
  try {
    analytics = getAnalytics(app);
  } catch (error) {
    // Analytics initialization failed silently
  }
}

export { auth, db, storage, analytics };
export default app; 