import React, { useState, useEffect } from 'react';
import { getBackendStatus, switchBackend } from '../utils/apiClient';

const BackendStatus = () => {
  const [status, setStatus] = useState(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const updateStatus = () => {
      setStatus(getBackendStatus());
    };

    // Update status immediately
    updateStatus();

    // Update status every 5 seconds
    const interval = setInterval(updateStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleSwitchBackend = async (backendName) => {
    try {
      await switchBackend(backendName);
      setStatus(getBackendStatus());
    } catch (error) {
      console.error('Failed to switch backend:', error);
    }
  };

  if (!status) return null;

  // Only show in development
  if (import.meta.env.PROD) return null;

  return (
    <div className="fixed top-4 left-4 bg-black bg-opacity-75 text-white p-4 rounded-lg text-xs font-mono z-50 max-w-xs">
      <div className="flex items-center justify-between mb-2">
        <div className="font-bold">Backend Status</div>
        <button
          onClick={() => setIsVisible(!isVisible)}
          className="text-gray-300 hover:text-white"
        >
          {isVisible ? '−' : '+'}
        </button>
      </div>
      
      {isVisible && (
        <div className="space-y-2">
          <div className="text-sm">
            <div className="font-semibold">Current:</div>
            <div className={`text-xs ${status.current?.isHealthy ? 'text-green-400' : 'text-red-400'}`}>
              {status.current?.name || 'None'} 
              {status.current?.isHealthy ? ' ✅' : ' ❌'}
            </div>
            <div className="text-xs text-gray-400">
              {status.current?.url}
            </div>
          </div>

          <div className="text-sm">
            <div className="font-semibold">Available:</div>
            {Object.entries(status.all).map(([key, backend]) => (
              <div key={key} className="flex items-center justify-between text-xs">
                <span className={key === status.current?.name ? 'text-green-400' : 'text-gray-300'}>
                  {backend.name}
                </span>
                <button
                  onClick={() => handleSwitchBackend(key)}
                  className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs"
                  disabled={key === status.current?.name}
                >
                  Switch
                </button>
              </div>
            ))}
          </div>

          {status.fallbackHistory.length > 0 && (
            <div className="text-sm">
              <div className="font-semibold">Recent Switches:</div>
              <div className="text-xs text-gray-400 max-h-20 overflow-y-auto">
                {status.fallbackHistory.slice(-3).map((event, index) => (
                  <div key={index} className="text-xs">
                    {new Date(event.timestamp).toLocaleTimeString()} - {event.backend}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BackendStatus;
