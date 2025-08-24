import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../utils/config';
import { loadAdSenseScript } from '../utils/ads';
import { 
  CheckCircleIcon, 
  PlayIcon, 
  ShareIcon, 
  HeartIcon,
  SparklesIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

export default function TrialTasks({ onTrialActivated }) {
  const { token } = useAuth();
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completingTask, setCompletingTask] = useState(null);
  const [shareCode, setShareCode] = useState('');
  const [adLoaded, setAdLoaded] = useState(false);
  const [adError, setAdError] = useState(false);
  const [adCompleted, setAdCompleted] = useState(false);

  useEffect(() => {
    fetchProgress();
  }, []);

  useEffect(() => {
    return () => {
      const adContainer = document.getElementById('trial-ad-container');
      if (adContainer) {
        document.body.removeChild(adContainer);
      }
    };
  }, []);

  const fetchProgress = async () => {
    try {
      // Load AdSense script
      loadAdSenseScript()
        .then(() => setAdLoaded(true))
        .catch(err => {
          console.error('Failed to load AdSense:', err);
          setAdError(true);
        });
      
      const response = await fetch(`${getApiUrl()}/api/trial/progress`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (data.success) {
        setProgress(data.progress);
      }
    } catch (error) {
      console.error('Failed to fetch trial progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const completeTask = async (taskType, metadata = {}) => {
    setCompletingTask(taskType);
    try {
      const response = await fetch(`${getApiUrl()}/api/trial/complete-task`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ taskType, metadata })
      });
      
      const data = await response.json();
      if (data.success) {
        setProgress(data.progress);
        if (data.trialActivated && onTrialActivated) {
          onTrialActivated();
        }
      }
    } catch (error) {
      console.error('Failed to complete task:', error);
    } finally {
      setCompletingTask(null);
    }
  };

  const handleShareVerification = async () => {
    setCompletingTask('share_with_friends');
    try {
      const response = await fetch(`${getApiUrl()}/api/trial/verify-share`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ shareCount: 10, shareMethod: 'manual' })
      });
      
      const data = await response.json();
      if (data.success) {
        setShareCode(data.verificationCode);
        await fetchProgress();
        if (data.trialActivated && onTrialActivated) {
          onTrialActivated();
        }
      }
    } catch (error) {
      console.error('Failed to verify share:', error);
    } finally {
      setCompletingTask(null);
    }
  };

  const watchAd = async () => {
    if (!adLoaded) {
      setAdError(true);
      return;
    }

    setCompletingTask('watch_ad');
    try {
      // Show AdSense ad
      window.adsbygoogle = window.adsbygoogle || [];
      window.adsbygoogle.push({
        overlays: {bottom: true},
        params: {
          'client': 'ca-pub-7023789007176202',
          'adtest': 'on',
          'format': 'autorelaxed'
        }
      });
      
      // Create ad container
      let adContainer = document.createElement('div');
      adContainer.id = 'trial-ad-container';
      adContainer.innerHTML = `
        <ins class="adsbygoogle"
          style="display:block"
          data-ad-client="ca-pub-7023789007176202"
          data-ad-slot="1234567890"
          data-ad-format="auto"
          data-full-width-responsive="true">
        </ins>
      `;
      
      document.body.appendChild(adContainer);
      
      // Listen for ad completion
      adContainer.addEventListener('adViewable', () => {
        setTimeout(() => {
          try {
            completeTask('watch_ad', { adProvider: 'adsense' });
            setAdCompleted(true);
          } finally {
            if (adContainer) {
              document.body.removeChild(adContainer);
              adContainer = null;
            }
          }
        }, 1000);
      });
    } catch (err) {
      console.error('Ad failed to load:', err);
      setAdError(true);
      setCompletingTask(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const tasks = [
    {
      id: 'watch_ad',
      title: 'Watch Advertisement',
      description: 'Watch a 30-second ad to support LifeBuddy',
      icon: adCompleted ? CheckCircleIcon : PlayIcon,
      color: 'bg-red-500',
      action: watchAd,
      buttonText: completingTask === 'watch_ad' ? 'Watching...' : 'Watch Ad'
    },
    {
      id: 'follow_instagram',
      title: 'Follow on Instagram',
      description: 'Follow @lifebuddy_app on Instagram',
      icon: HeartIcon,
      color: 'bg-pink-500',
      action: () => {
        window.open('https://instagram.com/lifebuddy_app', '_blank');
        setTimeout(() => completeTask('follow_instagram', { platform: 'instagram' }), 2000);
      },
      buttonText: completingTask === 'follow_instagram' ? 'Verifying...' : 'Follow & Verify'
    },
    {
      id: 'share_with_friends',
      title: 'Share with 10 Friends',
      description: 'Share LifeBuddy with 10 friends via any platform',
      icon: ShareIcon,
      color: 'bg-blue-500',
      action: handleShareVerification,
      buttonText: completingTask === 'share_with_friends' ? 'Verifying...' : 'I Shared with Friends'
    }
  ];

  const completedTasks = progress?.tasks.filter(t => t.completed).length || 0;
  const totalTasks = progress?.totalTasks || 3;

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <SparklesIcon className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          Get 7 Days Free Premium
        </h2>
        <p className="text-gray-600 mb-4">
          Complete these simple tasks to unlock your free trial
        </p>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-6">
          <div 
            className="bg-gradient-to-r from-purple-500 to-blue-600 h-3 rounded-full transition-all duration-500"
            style={{ width: `${(completedTasks / totalTasks) * 100}%` }}
          ></div>
        </div>
        <div className="text-sm text-gray-500">
          {completedTasks}/{totalTasks} tasks completed
        </div>
      </div>

      <div className="space-y-4">
        {tasks.map((task) => {
          const taskProgress = progress?.tasks.find(t => t.taskType === task.id);
          const isCompleted = taskProgress?.completed || false;
          const isWorking = completingTask === task.id;

          return (
            <div 
              key={task.id}
              className={`p-6 rounded-xl border-2 transition-all duration-300 ${
                isCompleted 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-gray-200 bg-white hover:border-blue-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isCompleted ? 'bg-green-500' : task.color
                  }`}>
                    {isCompleted ? (
                      <CheckCircleIcon className="w-6 h-6 text-white" />
                    ) : (
                      <task.icon className="w-6 h-6 text-white" />
                    )}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">{task.title}</h3>
                    <p className="text-sm text-gray-600">{task.description}</p>
                    {isCompleted && taskProgress?.completedAt && (
                      <p className="text-xs text-green-600 mt-1">
                        Completed {new Date(taskProgress.completedAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
                
                {!isCompleted && (
                  <button
                    onClick={task.action}
                    disabled={isWorking}
                    className={`px-6 py-2 rounded-lg font-medium transition-all duration-300 ${
                      isWorking
                        ? 'bg-gray-400 text-white cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700 transform hover:scale-105'
                    }`}
                  >
                    {task.buttonText}
                    
                    {task.id === 'watch_ad' && adError && (
                      <div className="mt-2 text-red-600 text-sm flex items-center">
                        <ExclamationTriangleIcon className="w-4 h-4 mr-1" />
                        Ad failed to load
                      </div>
                    )}
                    
                    {task.id === 'watch_ad' && !adLoaded && !adError && (
                      <div className="mt-2 text-yellow-600 text-sm">
                        Loading ad system...
                      </div>
                    )}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {shareCode && (
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Share Verification Code</h4>
          <p className="text-sm text-blue-700 mb-2">
            Use this code to verify you've shared with friends:
          </p>
          <code className="bg-blue-100 text-blue-800 px-3 py-1 rounded font-mono text-lg">
            {shareCode}
          </code>
        </div>
      )}

      {progress?.isTrialEligible && (
        <div className="mt-8 p-6 bg-gradient-to-r from-green-50 to-blue-50 border border-green-200 rounded-xl text-center">
          <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-3" />
          <h3 className="text-xl font-bold text-green-900 mb-2">
            🎉 Trial Activated!
          </h3>
          <p className="text-green-700 mb-4">
            Congratulations! You now have 7 days of free premium access to LifeBuddy AI.
          </p>
          <div className="flex gap-3 justify-center">
            <a 
              href="/ai-chat" 
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Start AI Chat
            </a>
            <a 
              href="/ai-voice" 
              className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Try Voice Chat
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
