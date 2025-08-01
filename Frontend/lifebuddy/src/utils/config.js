// Configuration for different environments
const config = {
  // API URL - will be set based on environment
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5001',
  
  // Environment detection
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  
  // Firebase config
  firebase: {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
  }
};

// Helper function to get the correct API URL
export const getApiUrl = () => {
  // If we're in development and no API URL is set, use localhost
  if (config.isDevelopment && !import.meta.env.VITE_API_URL) {
    return 'http://localhost:5001';
  }
  
  // Otherwise use the configured API URL
  return config.apiUrl;
};

// Helper function to log configuration for debugging
export const logConfig = () => {
  console.log('=== Environment Configuration ===');
  console.log('Environment:', config.isDevelopment ? 'Development' : 'Production');
  console.log('API URL:', getApiUrl());
  console.log('Firebase Project ID:', config.firebase.projectId);
  console.log('===============================');
};

export default config; 