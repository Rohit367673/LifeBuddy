import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { usePremium } from '../context/PremiumContext';
import api from '../utils/api';
import LoadingScreen from './LoadingScreen';

const TrialDashboard = () => {
  const { currentUser } = useAuth();
  const { subscription, refreshSubscription } = usePremium();
  const [progress, setProgress] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchTrialProgress = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/trial/progress');
        setProgress(response.data.progress);
      } catch (err) {
        setError('Failed to load trial progress');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (currentUser) {
      fetchTrialProgress();
    }
  }, [currentUser]);

  const completeTask = async (taskType) => {
    try {
      setLoading(true);
      await api.post('/api/trial/complete-task', { taskType });
      const response = await api.get('/api/trial/progress');
      setProgress(response.data.progress);
      refreshSubscription();
    } catch (err) {
      setError('Failed to complete task');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingScreen text="Loading trial dashboard…" />;
  }

  if (error) {
    return <div className="text-red-500">{error}</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">Free Trial</h1>
        <p className="text-slate-600">Complete these tasks to unlock a free trial of Premium features</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {progress?.tasks.map((task) => (
          <div 
            key={task.taskType} 
            className={`p-6 rounded-2xl shadow-lg transition-all duration-300 ${
              task.completed ? 'bg-gradient-to-br from-green-100 to-green-50 border border-green-200' : 'bg-white'
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-lg text-slate-800 capitalize">
                {task.taskType.replace(/_/g, ' ')}
              </h3>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                task.completed ? 'bg-green-500' : 'bg-slate-200'
              }`}>
                {task.completed ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <span className="text-slate-600 font-bold">!</span>
                )}
              </div>
            </div>
            
            <p className="text-slate-600 mb-4">
              {task.taskType === 'watch_ad' && 'Watch a short ad to support us.'}
              {task.taskType === 'follow_instagram' && 'Follow us on Instagram.'}
              {task.taskType === 'share_with_friends' && 'Share LifeBuddy with 10 friends.'}
            </p>

            <button
              onClick={() => completeTask(task.taskType)}
              disabled={task.completed || loading}
              className={`w-full py-2 rounded-lg font-medium ${
                task.completed 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow hover:shadow-lg'
              }`}
            >
              {task.completed ? 'Completed' : 'Complete Task'}
            </button>
          </div>
        ))}
      </div>

      {progress?.isTrialEligible && (
        <div className="mt-8 p-6 bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl border border-green-200 text-center">
          <h3 className="text-xl font-bold text-green-700 mb-2">Congratulations!</h3>
          <p className="text-green-600 mb-4">You've unlocked a free trial of Premium features.</p>
          <a 
            href="/" 
            className="px-6 py-2 bg-gradient-to-br from-green-500 to-green-600 text-white rounded-lg font-medium shadow hover:shadow-lg"
          >
            Start Using Premium
          </a>
        </div>
      )}
    </div>
  );
};

export default TrialDashboard;
