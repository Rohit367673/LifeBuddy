// Configuration for different environments
const config = {
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

// Backend URLs configuration
export const BACKEND_URLS = {
  railway: import.meta.env.VITE_RAILWAY_URL || 'https://lifebuddy-backend-production.up.railway.app',
  render: import.meta.env.VITE_RENDER_URL || 'https://lifebuddy.onrender.com',
  local: 'http://localhost:5001'
};

// Helper function to get the correct API URL (now uses smart backend manager)
export const getApiUrl = async () => {
  // Import dynamically to avoid circular dependencies
  const { getApiUrl: getSmartApiUrl } = await import('./backendManager.js');
  return await getSmartApiUrl();
};

// Helper function to get fallback API URLs
export const getFallbackApiUrls = () => {
  return Object.values(BACKEND_URLS);
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