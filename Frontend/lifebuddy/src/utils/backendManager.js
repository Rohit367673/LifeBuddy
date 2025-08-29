// Smart Backend URL Manager for Render/Railway switching
class BackendManager {
  constructor() {
    this.backends = {
      railway: {
        url: import.meta.env.VITE_RAILWAY_URL || 'https://lifebuddy-backend-production.up.railway.app',
        name: 'Railway',
        priority: 1
      },
      render: {
        url: import.meta.env.VITE_RENDER_URL || 'https://lifebuddy.onrender.com',
        name: 'Render',
        priority: 2
      },
      local: {
        url: 'http://localhost:5001',
        name: 'Local',
        priority: 3
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
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
      
      const response = await fetch(`${url}/api/health`, {
        method: 'GET',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (response.ok) {
        const data = await response.json();
        return data.status === 'OK';
      }
      return false;
    } catch (error) {
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

export default backendManager;
