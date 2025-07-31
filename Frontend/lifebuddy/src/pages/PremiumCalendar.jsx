import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TaskSchedulerForm } from '../components/figma/TaskSchedulerForm';
import { Sparkles, Zap } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function PremiumCalendar() {
  const { user, getFirebaseToken } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [todayTask, setTodayTask] = useState(null); // Force null to show new form
  const [message, setMessage] = useState('');
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const isAdmin = user && user.email === 'rohit367673@gmail.com';

  // Fetch today's task on component mount
  useEffect(() => {
    fetchTodayTask();
  }, []);

  const fetchTodayTask = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/premium-tasks/today`, {
        headers: {
          'Authorization': `Bearer ${await getFirebaseToken()}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.taskId) {
          setTodayTask(data);
        }
      }
    } catch (error) {
      console.error('Error fetching today task:', error);
    }
  };

  const markTodayTask = async (status) => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/premium-tasks/today`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getFirebaseToken()}`
        },
        body: JSON.stringify({ status })
      });
      if (response.ok) {
        setMessage(`Task marked as ${status}!`);
        setTimeout(() => {
          setMessage('');
          fetchTodayTask();
        }, 2000);
      }
    } catch (error) {
      setMessage('Failed to update task status');
    } finally {
      setLoading(false);
    }
  };

  const resetSchedule = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/premium-tasks/current`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${await getFirebaseToken()}` }
      });
      if (!res.ok) {
        const data = await res.json();
        setMessage(data.message || 'Failed to end current schedule.');
        setLoading(false);
        return;
      }
      setTodayTask(null);
      setMessage('Schedule ended successfully');
      setTimeout(() => setMessage(''), 2000);
    } catch (err) {
      setMessage('Failed to end current schedule.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      {/* Page Header */}
      <motion.div 
        className="mb-8"
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="text-center">
          <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Your AI Roadmap
          </h1>
          <p className="text-slate-600">Powered by DeepSeek Intelligence</p>
        </div>
      </motion.div>

      {/* Main Content */}
      <motion.div 
        className="max-w-6xl mx-auto"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2 }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Productivity Tips - Takes 2/3 on desktop */}
          <motion.div 
            className="lg:col-span-2"
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            {/* Productivity Tips Section */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z"/>
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-slate-800">Productivity Tips</h3>
              </div>
              <p className="text-slate-600 mb-6">
                Maximize your productivity with AI-powered task scheduling and smart time management strategies.
              </p>
              
              <div className="space-y-4">
                {/* Set Clear Goals */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-b from-purple-500 to-pink-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-1">Set Clear Goals</h4>
                    <p className="text-slate-600">Define specific, measurable objectives for better task completion rates.</p>
                  </div>
                </div>
                
                {/* Time Blocking */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-b from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-1">Time Blocking</h4>
                    <p className="text-slate-600">Allocate dedicated time slots for focused work on important tasks.</p>
                  </div>
                </div>
                
                {/* AI Optimization */}
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-b from-purple-500 to-blue-500 rounded-lg flex items-center justify-center flex-shrink-0">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-800 mb-1">AI Optimization</h4>
                    <p className="text-slate-600">Let our AI analyze your patterns and suggest optimal scheduling times.</p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Task Section - Takes 1/3 on desktop */}
          <motion.div 
            className="lg:col-span-1"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.8 }}
          >
            {/* Exit Confirmation Modal */}
            {showExitConfirm && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4">
                <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full text-center">
                  <h2 className="text-xl font-bold mb-4 text-red-600">End Schedule?</h2>
                  <p className="mb-6 text-gray-700">Are you sure you want to exit? This will end your schedule.</p>
                  <div className="flex justify-center gap-4">
                    <button
                      className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300"
                      onClick={() => setShowExitConfirm(false)}
                    >
                      Cancel
                    </button>
                    <button
                      className="px-6 py-2 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold hover:from-red-600 hover:to-pink-600"
                      onClick={async () => { setShowExitConfirm(false); await resetSchedule(); }}
                    >
                      Yes, Exit
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* If a schedule exists, show the current task */}
            {todayTask && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-slate-800 mb-2">Good morning, let's make today productive!</h2>
                  <p className="text-slate-600 text-sm">Your AI-generated task for today</p>
                </div>
                
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-xl border border-purple-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                        2
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-500">Day 2</div>
                        <div className="text-red-500 text-lg">🚀</div>
                      </div>
                    </div>
                    <div className="font-semibold text-slate-800 mb-2">{todayTask.title}</div>
                    <div className="text-slate-600 mb-3">{todayTask.subtask}</div>
                    {todayTask.notes && (
                      <div className="text-xs text-slate-500 bg-white/50 p-3 rounded-lg">
                        {todayTask.notes}
                      </div>
                    )}
                    <div className="text-xs text-slate-500 mt-3">Full schedule sent to your Telegram!</div>
                  </div>
                  
                  <div className="flex flex-col gap-2">
                    <button
                      className="px-4 py-2 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-all duration-300"
                      onClick={() => markTodayTask('completed')}
                      disabled={loading}
                    >
                      ✔ Mark Complete
                    </button>
                    <button
                      className="px-4 py-2 bg-orange-500 text-white rounded-lg font-medium hover:bg-orange-600 transition-all duration-300"
                      onClick={() => markTodayTask('skipped')}
                      disabled={loading}
                    >
                      ►► Skip & Reschedule
                    </button>
                    <button
                      className="px-4 py-2 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg font-medium hover:from-red-600 hover:to-pink-600 transition-all duration-300"
                      onClick={() => setShowExitConfirm(true)}
                      disabled={loading}
                    >
                      ● End Schedule
                    </button>
                  </div>
                  
                  {message && (
                    <div className="text-center p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
                      {message}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Show loading state */}
            {loading && (
              <div className="bg-white rounded-xl shadow-lg p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                <p className="text-slate-600">Loading your roadmap...</p>
              </div>
            )}

            {/* Show TaskSchedulerForm if no current task */}
            {!loading && !todayTask && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <div className="text-center mb-6">
                  <h2 className="text-xl font-bold text-slate-800 mb-2">Good morning, let's make today productive!</h2>
                  <p className="text-slate-600 text-sm">Your AI-generated task for today</p>
                </div>
                <TaskSchedulerForm onScheduleCreated={fetchTodayTask} />
              </div>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}