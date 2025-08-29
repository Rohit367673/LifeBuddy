const mongoose = require('mongoose');
require('dotenv').config();

// Performance monitoring script
class PerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: 0,
      slowRequests: 0,
      errors: 0,
      startTime: Date.now(),
      memoryUsage: [],
      responseTimes: []
    };
  }

  // Track request performance
  trackRequest(req, res, next) {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      this.metrics.requests++;
      this.metrics.responseTimes.push(duration);
      
      if (duration > 1000) {
        this.metrics.slowRequests++;
        console.log(`[PERF] Slow request: ${req.method} ${req.path} - ${duration}ms`);
      }
      
      // Keep only last 1000 response times for memory efficiency
      if (this.metrics.responseTimes.length > 1000) {
        this.metrics.responseTimes.shift();
      }
    });
    
    next();
  }

  // Track errors
  trackError(error) {
    this.metrics.errors++;
    console.log(`[ERROR] ${error.message}`);
  }

  // Get performance statistics
  getStats() {
    const uptime = Date.now() - this.metrics.startTime;
    const avgResponseTime = this.metrics.responseTimes.length > 0 
      ? this.metrics.responseTimes.reduce((a, b) => a + b, 0) / this.metrics.responseTimes.length 
      : 0;
    
    const memoryUsage = process.memoryUsage();
    
    return {
      uptime: Math.round(uptime / 1000), // seconds
      requests: this.metrics.requests,
      slowRequests: this.metrics.slowRequests,
      errors: this.metrics.errors,
      avgResponseTime: Math.round(avgResponseTime),
      memoryUsage: {
        rss: Math.round(memoryUsage.rss / 1024 / 1024), // MB
        heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024), // MB
        external: Math.round(memoryUsage.external / 1024 / 1024) // MB
      },
      requestsPerSecond: Math.round((this.metrics.requests / (uptime / 1000)) * 100) / 100
    };
  }

  // Log performance metrics
  logMetrics() {
    const stats = this.getStats();
    console.log('\n=== Performance Metrics ===');
    console.log(`Uptime: ${stats.uptime}s`);
    console.log(`Total Requests: ${stats.requests}`);
    console.log(`Slow Requests (>1s): ${stats.slowRequests}`);
    console.log(`Errors: ${stats.errors}`);
    console.log(`Avg Response Time: ${stats.avgResponseTime}ms`);
    console.log(`Requests/Second: ${stats.requestsPerSecond}`);
    console.log(`Memory Usage:`);
    console.log(`  RSS: ${stats.memoryUsage.rss}MB`);
    console.log(`  Heap Used: ${stats.memoryUsage.heapUsed}MB`);
    console.log(`  Heap Total: ${stats.memoryUsage.heapTotal}MB`);
    console.log(`  External: ${stats.memoryUsage.external}MB`);
    console.log('===========================\n');
  }

  // Start monitoring
  start() {
    // Log metrics every 5 minutes
    setInterval(() => {
      this.logMetrics();
    }, 5 * 60 * 1000);

    // Monitor memory usage
    setInterval(() => {
      const memoryUsage = process.memoryUsage();
      this.metrics.memoryUsage.push({
        timestamp: Date.now(),
        rss: memoryUsage.rss,
        heapUsed: memoryUsage.heapUsed,
        heapTotal: memoryUsage.heapTotal
      });

      // Keep only last 100 memory readings
      if (this.metrics.memoryUsage.length > 100) {
        this.metrics.memoryUsage.shift();
      }
    }, 60000); // Every minute

    console.log('Performance monitoring started');
  }
}

// Create global instance
const performanceMonitor = new PerformanceMonitor();

// Export for use in app.js
module.exports = performanceMonitor;
