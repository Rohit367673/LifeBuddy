import axios from 'axios';
import backendManager from './backendManager.js';

// Create axios instance with automatic backend fallback
const apiClient = axios.create({
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor to set the correct backend URL
apiClient.interceptors.request.use(async (config) => {
  try {
    const baseURL = await backendManager.getApiUrl();
    config.baseURL = baseURL;
    console.log(`🌐 API Request to: ${baseURL}${config.url}`);
    return config;
  } catch (error) {
    console.error('Failed to get backend URL:', error);
    // Fallback to default
    config.baseURL = backendManager.backends.railway.url;
    return config;
  }
});

// Response interceptor for automatic retry with different backends
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If this is a retry request, don't retry again
    if (originalRequest._retry) {
      return Promise.reject(error);
    }

    // Check if it's a network error or server error
    if (error.code === 'ECONNABORTED' || error.response?.status >= 500) {
      console.log(`🔄 Retrying request with different backend...`);
      
      try {
        // Mark as retry to prevent infinite loops
        originalRequest._retry = true;
        
        // Get fallback backends
        const fallbackUrls = backendManager.getFallbackUrls();
        const currentUrl = originalRequest.baseURL;
        
        // Find next available backend
        const currentIndex = fallbackUrls.indexOf(currentUrl);
        const nextBackend = fallbackUrls[(currentIndex + 1) % fallbackUrls.length];
        
        console.log(`🔄 Switching from ${currentUrl} to ${nextBackend}`);
        
        // Update base URL and retry
        originalRequest.baseURL = nextBackend;
        
        // Retry the request
        return apiClient(originalRequest);
      } catch (retryError) {
        console.error('Retry failed:', retryError);
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

// Add request/response logging in development
if (import.meta.env.DEV) {
  apiClient.interceptors.request.use(
    (config) => {
      console.log(`🚀 API Request:`, {
        method: config.method?.toUpperCase(),
        url: config.url,
        baseURL: config.baseURL,
        data: config.data
      });
      return config;
    },
    (error) => {
      console.error('❌ Request Error:', error);
      return Promise.reject(error);
    }
  );

  apiClient.interceptors.response.use(
    (response) => {
      console.log(`✅ API Response:`, {
        status: response.status,
        url: response.config.url,
        data: response.data
      });
      return response;
    },
    (error) => {
      console.error('❌ Response Error:', {
        status: error.response?.status,
        url: error.config?.url,
        message: error.message,
        data: error.response?.data
      });
      return Promise.reject(error);
    }
  );
}

// Helper function to get current backend status
export const getBackendStatus = () => backendManager.getBackendStatus();

// Helper function to manually switch backends
export const switchBackend = (name) => backendManager.switchToBackend(name);

// Helper function to start health monitoring
export const startHealthMonitoring = () => backendManager.startHealthMonitoring();

// Helper function to stop health monitoring
export const stopHealthMonitoring = () => backendManager.stopHealthMonitoring();

export default apiClient;
