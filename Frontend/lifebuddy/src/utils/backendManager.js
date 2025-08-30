// Smart Backend URL Manager for Render/Railway switching
const BACKEND_URLS = {
  local: 'http://localhost:5001',
  railway: 'https://lifebuddy-backend-production.up.railway.app',
  render: 'https://lifebuddy.onrender.com'
};

class BackendManager {
  constructor() {
    // In development, prioritize local backend
    const isDevelopment = import.meta.env.DEV;
    
    this.backends = {
      local: {
        url: BACKEND_URLS.local,
        name: 'Local',
        priority: isDevelopment ? 1 : 99  // Local only in development
      },
      railway: {
        url: import.meta.env.VITE_RAILWAY_URL || BACKEND_URLS.railway,
        name: 'Railway',
        priority: 1  // Railway primary - force with env var
      },
      render: {
        url: import.meta.env.VITE_RENDER_URL || BACKEND_URLS.render,
        name: 'Render',
        priority: 2  // Render fallback
      }
    };
    
    this.currentBackend = null;
    this.fallbackHistory = [];
    this.healthCheckInterval = null;
  }

  // Get the best available backend
  async getBestBackend() {
    if (this.currentBackend && this.currentBackend.isHealthy) {
      return this.currentBackend;
    }

    // Try backends in priority order
    const sortedBackends = Object.values(this.backends).sort((a, b) => a.priority - b.priority);
    
    for (const backend of sortedBackends) {
      try {
        const isHealthy = await this.healthCheck(backend.url);
        if (isHealthy) {
          this.currentBackend = { ...backend, isHealthy: true };
          console.log(`✅ Backend switched to: ${backend.name} (${backend.url})`);
          return this.currentBackend;
        }
      } catch (error) {
        console.warn(`⚠️ Health check failed for ${backend.name}:`, error.message);
        // Do not skip remote backends in development; allow fallback to Railway/Render
      }
    }

    // If all fail, return the highest priority backend as fallback
    const fallback = sortedBackends[0];
    console.warn(`🚨 All backends failed, using fallback: ${fallback.name}`);
    return { ...fallback, isHealthy: false };
  }

  // Health check for backend
  async healthCheck(url) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout
      
      const response = await fetch(`${url}/api/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      
      // Accept any successful response, not just specific JSON format
      return response.ok;
    } catch (error) {
      console.log(`Health check failed for ${url}:`, error.message);
      return false;
    }
  }

  // Get API URL with automatic fallback
  async getApiUrl() {
    const backend = await this.getBestBackend();
    return backend.url;
  }

  // Get all available backends for debugging
  getBackendStatus() {
    return {
      current: this.currentBackend,
      all: this.backends,
      fallbackHistory: this.fallbackHistory
    };
  }

  // Start automatic health monitoring
  startHealthMonitoring(intervalMs = 30000) { // Check every 30 seconds
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    this.healthCheckInterval = setInterval(async () => {
      if (this.currentBackend) {
        const isHealthy = await this.healthCheck(this.currentBackend.url);
        if (!isHealthy) {
          console.log(`🔄 Backend ${this.currentBackend.name} became unhealthy, switching...`);
          this.currentBackend.isHealthy = false;
          this.fallbackHistory.push({
            timestamp: new Date().toISOString(),
            backend: this.currentBackend.name,
            reason: 'Health check failed'
          });
          
          // Keep only last 10 fallback events
          if (this.fallbackHistory.length > 10) {
            this.fallbackHistory.shift();
          }
        }
      }
    }, intervalMs);

    console.log(`🔍 Health monitoring started (${intervalMs}ms interval)`);
  }

  // Stop health monitoring
  stopHealthMonitoring() {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      console.log('🛑 Health monitoring stopped');
    }
  }

  // Force switch to specific backend
  async switchToBackend(backendName) {
    const backend = this.backends[backendName];
    if (!backend) {
      throw new Error(`Backend '${backendName}' not found`);
    }

    const isHealthy = await this.healthCheck(backend.url);
    if (isHealthy) {
      this.currentBackend = { ...backend, isHealthy: true };
      console.log(`🔄 Manually switched to: ${backend.name}`);
      return true;
    } else {
      throw new Error(`Backend '${backendName}' is not healthy`);
    }
  }

  // Get fallback URLs for axios interceptors
  getFallbackUrls() {
    return Object.values(this.backends)
      .sort((a, b) => a.priority - b.priority)
      .map(b => b.url);
  }
}

// Create singleton instance
const backendManager = new BackendManager();

// Export functions for easy use
export const getApiUrl = () => backendManager.getApiUrl();
export const getBackendStatus = () => backendManager.getBackendStatus();
export const switchToBackend = (name) => backendManager.switchToBackend(name);
export const startHealthMonitoring = () => backendManager.startHealthMonitoring();
export const stopHealthMonitoring = () => backendManager.stopHealthMonitoring();

// Add the missing switchBackend function that AuthContext expects
export const switchBackend = async () => {
  const backend = await backendManager.getBestBackend();
  return backend.url;
};

export default backendManager;
