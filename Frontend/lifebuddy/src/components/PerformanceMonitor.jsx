import React, { useEffect, useState } from 'react';

const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({});

  useEffect(() => {
    // Measure page load performance
    const measurePageLoad = () => {
      if ('performance' in window) {
        const perfData = performance.getEntriesByType('navigation')[0];
        if (perfData) {
          setMetrics(prev => ({
            ...prev,
            pageLoad: {
              domContentLoaded: Math.round(perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart),
              loadComplete: Math.round(perfData.loadEventEnd - perfData.loadEventStart),
              totalTime: Math.round(perfData.loadEventEnd - perfData.fetchStart)
            }
          }));
        }
      }
    };

    // Measure Core Web Vitals
    const measureCoreWebVitals = () => {
      if ('PerformanceObserver' in window) {
        // Largest Contentful Paint (LCP)
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          setMetrics(prev => ({
            ...prev,
            lcp: Math.round(lastEntry.startTime)
          }));
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay (FID)
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            setMetrics(prev => ({
              ...prev,
              fid: Math.round(entry.processingStart - entry.startTime)
            }));
          });
        });
        fidObserver.observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          setMetrics(prev => ({
            ...prev,
            cls: Math.round(clsValue * 1000) / 1000
          }));
        });
        clsObserver.observe({ entryTypes: ['layout-shift'] });
      }
    };

    // Measure memory usage
    const measureMemory = () => {
      if ('memory' in performance) {
        setMetrics(prev => ({
          ...prev,
          memory: {
            used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
            total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
            limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
          }
        }));
      }
    };

    // Initial measurements
    if (document.readyState === 'complete') {
      measurePageLoad();
      measureCoreWebVitals();
      measureMemory();
    } else {
      window.addEventListener('load', () => {
        measurePageLoad();
        measureCoreWebVitals();
        measureMemory();
      });
    }

    // Periodic memory monitoring
    const memoryInterval = setInterval(measureMemory, 10000);

    return () => {
      clearInterval(memoryInterval);
    };
  }, []);

  // Only show in development
  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black bg-opacity-75 text-white p-4 rounded-lg text-xs font-mono z-50 max-w-xs">
      <div className="font-bold mb-2">Performance Metrics</div>
      {metrics.pageLoad && (
        <div className="mb-2">
          <div>Page Load: {metrics.pageLoad.totalTime}ms</div>
          <div>DOM Ready: {metrics.pageLoad.domContentLoaded}ms</div>
        </div>
      )}
      {metrics.lcp && (
        <div className="mb-2">
          <div>LCP: {metrics.lcp}ms</div>
        </div>
      )}
      {metrics.fid && (
        <div className="mb-2">
          <div>FID: {metrics.fid}ms</div>
        </div>
      )}
      {metrics.cls && (
        <div className="mb-2">
          <div>CLS: {metrics.cls}</div>
        </div>
      )}
      {metrics.memory && (
        <div>
          <div>Memory: {metrics.memory.used}MB / {metrics.memory.total}MB</div>
        </div>
      )}
    </div>
  );
};

export default PerformanceMonitor;
