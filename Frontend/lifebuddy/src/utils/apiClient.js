import axios from 'axios';
import backendManager from './backendManager.js';
import { getAuthToken, setAuthToken, clearAuthCookies } from './cookies.js';

// Create axios instance with automatic backend fallback
const apiClient = axios.create({
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json'
  }
});

// Single in-flight refresh request lock to prevent race conditions
let refreshTokenRequest = null;

// Request interceptor to set the correct backend URL
apiClient.interceptors.request.use(async (config) => {
  try {
    const baseURL = await backendManager.getApiUrl();
    config.baseURL = baseURL;
    console.log(`🌐 API Request to: ${baseURL}${config.url}`);

    // Inject Authorization header from secure cookie if present
    const token = getAuthToken();
    if (token && !config.headers?.Authorization) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  } catch (error) {
    console.error('Failed to get backend URL:', error);
    // Prefer Railway as fallback, then Render
    const railway = import.meta.env.VITE_RAILWAY_URL || 'https://lifebuddy-backend-production.up.railway.app';
    config.baseURL = railway || 'https://lifebuddy.onrender.com';
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

    // Handle 401 Unauthorized globally with token refresh
    if (error.response?.status === 401 && !originalRequest._retry401 && !originalRequest._isRefreshCall) {
      const currentToken = getAuthToken();
      // Only attempt refresh if we have a token to refresh
      if (!currentToken) {
        return Promise.reject(error);
      }
      
      originalRequest._retry401 = true;
      try {
        if (!refreshTokenRequest) {
          const baseURL = await backendManager.getApiUrl();
          refreshTokenRequest = apiClient.post('/api/auth/refresh', {}, {
            baseURL,
            headers: currentToken ? { Authorization: `Bearer ${currentToken}` } : {},
            _isRefreshCall: true
          }).then((res) => {
            const newToken = res?.data?.token;
            if (!newToken) throw new Error('No token returned from refresh endpoint');
            setAuthToken(newToken);
            // Notify app that token was refreshed
            try {
              window.dispatchEvent(new CustomEvent('auth:tokenRefreshed', { detail: { token: newToken } }));
            } catch (_) {}
            return newToken;
          }).catch((refreshErr) => {
            // Clear cookies and propagate error
            clearAuthCookies();
            // Notify app that refresh failed
            try {
              window.dispatchEvent(new Event('auth:refreshFailed'));
            } catch (_) {}
            throw refreshErr;
          }).finally(() => {
            refreshTokenRequest = null;
          });
        }

        const newToken = await refreshTokenRequest;
        // Retry original request with new token
        originalRequest.headers = originalRequest.headers || {};
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        if (!originalRequest.baseURL) {
          originalRequest.baseURL = await backendManager.getApiUrl();
        }
        return apiClient(originalRequest);
      } catch (e) {
        return Promise.reject(e);
      }
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
