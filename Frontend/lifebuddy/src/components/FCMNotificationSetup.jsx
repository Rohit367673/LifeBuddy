import { useEffect, useState } from 'react';
import { messaging, getToken } from '../utils/firebaseConfig';
import { useAuth } from '../context/AuthContext';

const VAPID_KEY = 'BLkHySMo_fyaPS_KaxjvHaXS2zUvAIrt2BgcxJ88dJ-EUNdu-IRb0txReI1Qahq-IMJL4YILT3iRu3GcJ0fYxdk';

export default function FCMNotificationSetup() {
  const { token: authToken } = useAuth();
  const [status, setStatus] = useState('idle');

  const requestAndRegister = async () => {
    setStatus('requesting');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setStatus('denied');
        alert('Notifications permission denied');
        return;
      }
      const fcmToken = await getToken(messaging, { vapidKey: VAPID_KEY });
      if (!fcmToken) throw new Error('No FCM token received');
      // Send token to backend
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/users/fcm-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ fcmToken })
      });
      if (!res.ok) throw new Error('Failed to register FCM token');
      setStatus('success');
      alert('Notifications enabled!');
    } catch (err) {
      setStatus('error');
      alert('Failed to enable notifications: ' + err.message);
    }
  };

  return (
    <div className="my-4 p-4 border rounded bg-blue-50">
      <h3 className="font-bold mb-2">Enable Daily Task Notifications</h3>
      <button
        className="px-4 py-2 bg-blue-600 text-white rounded"
        onClick={requestAndRegister}
        disabled={status === 'requesting' || status === 'success'}
      >
        {status === 'success' ? 'Notifications Enabled' : 'Enable Notifications'}
      </button>
      {status === 'error' && <p className="text-red-600 mt-2">Failed to enable notifications. Try again.</p>}
      {status === 'denied' && <p className="text-yellow-600 mt-2">Permission denied. Please allow notifications in your browser settings.</p>}
    </div>
  );
} 