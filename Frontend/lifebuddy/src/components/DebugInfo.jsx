import React, { useState, useEffect } from 'react';
import { auth } from '../utils/firebaseConfig';

const DebugInfo = () => {
  const [debugInfo, setDebugInfo] = useState({});
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const collectDebugInfo = () => {
      const info = {
        // Environment variables
        firebaseApiKey: import.meta.env.VITE_FIREBASE_API_KEY ? 'Set' : 'Missing',
        firebaseAuthDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || 'Missing',
        firebaseProjectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || 'Missing',
        
        // Browser info
        userAgent: navigator.userAgent,
        isSafari: /^((?!chrome|android).)*safari/i.test(navigator.userAgent),
        isMobile: /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent),
        isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent),
        
        // Current state
        currentUrl: window.location.href,
        hostname: window.location.hostname,
        protocol: window.location.protocol,
        
        // Firebase state
        authInitialized: !!auth,
        currentUser: auth?.currentUser?.email || 'None',
        
        // Session storage
        googleLoginInProgress: sessionStorage.getItem('googleLoginInProgress') || 'false',
        googleLoginTimestamp: sessionStorage.getItem('googleLoginTimestamp') || 'None',
        
        // Local storage
        hasUserToken: !!localStorage.getItem('userToken'),
        hasUserData: !!localStorage.getItem('userData'),
        
        // Cookies
        cookies: document.cookie || 'None'
      };
      
      setDebugInfo(info);
    };

    collectDebugInfo();
    
    // Update every 2 seconds
    const interval = setInterval(collectDebugInfo, 2000);
    return () => clearInterval(interval);
  }, []);

  const testGoogleAuth = async () => {
    try {
      console.log('🔧 Testing Google Auth...');
      
      // Test Firebase initialization
      if (!auth) {
        console.error('🔧 Firebase Auth not initialized');
        return;
      }
      
      // Test provider creation
      const { GoogleAuthProvider } = await import('firebase/auth');
      const provider = new GoogleAuthProvider();
      console.log('🔧 Provider created successfully');
      
      // Test popup capability
      try {
        const popup = window.open('', '_blank', 'width=500,height=600');
        if (popup) {
          popup.close();
          console.log('🔧 Popup test: PASSED');
        } else {
          console.log('🔧 Popup test: BLOCKED');
        }
      } catch (e) {
        console.log('🔧 Popup test: ERROR', e.message);
      }
      
    } catch (error) {
      console.error('🔧 Auth test failed:', error);
    }
  };

  const clearAuthState = () => {
    sessionStorage.removeItem('googleLoginInProgress');
    sessionStorage.removeItem('googleLoginTimestamp');
    localStorage.removeItem('userToken');
    localStorage.removeItem('userData');
    console.log('🔧 Auth state cleared');
  };

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-red-500 text-white px-3 py-1 rounded text-xs z-50"
      >
        Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded max-w-md max-h-96 overflow-y-auto text-xs z-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-bold">Debug Info</h3>
        <button onClick={() => setIsVisible(false)} className="text-red-400">×</button>
      </div>
      
      <div className="space-y-2">
        <div>
          <strong>Firebase Config:</strong>
          <div>API Key: {debugInfo.firebaseApiKey}</div>
          <div>Auth Domain: {debugInfo.firebaseAuthDomain}</div>
          <div>Project ID: {debugInfo.firebaseProjectId}</div>
          <div>Auth Initialized: {debugInfo.authInitialized ? 'Yes' : 'No'}</div>
        </div>
        
        <div>
          <strong>Browser:</strong>
          <div>Safari: {debugInfo.isSafari ? 'Yes' : 'No'}</div>
          <div>Mobile: {debugInfo.isMobile ? 'Yes' : 'No'}</div>
          <div>iOS: {debugInfo.isIOS ? 'Yes' : 'No'}</div>
        </div>
        
        <div>
          <strong>Current State:</strong>
          <div>URL: {debugInfo.currentUrl}</div>
          <div>Hostname: {debugInfo.hostname}</div>
          <div>User: {debugInfo.currentUser}</div>
        </div>
        
        <div>
          <strong>Session:</strong>
          <div>Login Progress: {debugInfo.googleLoginInProgress}</div>
          <div>Timestamp: {debugInfo.googleLoginTimestamp}</div>
        </div>
        
        <div className="space-y-1">
          <button 
            onClick={testGoogleAuth}
            className="bg-blue-500 px-2 py-1 rounded text-xs w-full"
          >
            Test Auth
          </button>
          <button 
            onClick={clearAuthState}
            className="bg-red-500 px-2 py-1 rounded text-xs w-full"
          >
            Clear State
          </button>
        </div>
      </div>
    </div>
  );
};

export default DebugInfo;
