import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, MessageCircle, Smartphone } from 'lucide-react';

export default function MessagingSetup() {
  const { token: authToken } = useAuth();
  const [status, setStatus] = useState('idle');
  const [userPlatform, setUserPlatform] = useState('email');

  const platforms = [
    {
      id: 'email',
      icon: Mail,
      title: 'Email',
      description: 'Receive daily tasks via email',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      id: 'whatsapp',
      icon: Smartphone,
      title: 'WhatsApp',
      description: 'Get notifications on WhatsApp (India-focused)',
      color: 'from-green-500 to-emerald-500'
    },
    {
      id: 'telegram',
      icon: MessageCircle,
      title: 'Telegram',
      description: 'Receive messages on Telegram (Global)',
      color: 'from-indigo-500 to-purple-500'
    }
  ];

  const updateNotificationPlatform = async (platform) => {
    setStatus('updating');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/users/notification-platform`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ notificationPlatform: platform })
      });
      
      if (res.ok) {
        setUserPlatform(platform);
        setStatus('success');
        alert(`Notification platform updated to ${platform}!`);
      } else {
        throw new Error('Failed to update notification platform');
      }
    } catch (err) {
      setStatus('error');
      alert('Failed to update notification platform: ' + err.message);
    }
  };

  return (
    <div className="my-4 p-6 border rounded-lg bg-gradient-to-r from-blue-50 to-purple-50">
      <h3 className="font-bold mb-4 text-lg">Daily Task Notifications</h3>
      <p className="text-sm text-gray-600 mb-4">
        Choose how you'd like to receive your daily learning tasks:
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {platforms.map((platform) => (
          <div
            key={platform.id}
            className={`relative p-4 border-2 rounded-xl cursor-pointer transition-all duration-300 ${
              userPlatform === platform.id 
                ? 'border-indigo-400 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-lg' 
                : 'border-slate-200 bg-white/80 hover:border-slate-300 hover:shadow-md'
            }`}
            onClick={() => updateNotificationPlatform(platform.id)}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg bg-gradient-to-r ${platform.color}`}>
                <platform.icon className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-800">{platform.title}</h4>
                <p className="text-xs text-slate-600">{platform.description}</p>
              </div>
            </div>
            {userPlatform === platform.id && (
              <div className="absolute top-2 right-2 w-6 h-6 bg-indigo-500 rounded-full flex items-center justify-center">
                <span className="text-white text-xs">✓</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {status === 'error' && (
        <p className="text-red-600 text-sm">Failed to update notification platform. Try again.</p>
      )}
      
      {status === 'success' && (
        <p className="text-green-600 text-sm">Notification platform updated successfully!</p>
      )}

      <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-sm text-yellow-800">
          <strong>Note:</strong> Make sure to provide your contact information in the task scheduler 
          to receive notifications on your chosen platform.
        </p>
      </div>
    </div>
  );
} 