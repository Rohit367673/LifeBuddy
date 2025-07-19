import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { CheckCircleIcon, ClockIcon, CalendarIcon, SparklesIcon, XCircleIcon, BellIcon } from '@heroicons/react/24/outline';
import { Sidebar } from '../components/figma/Sidebar';

export default function MySchedule() {
  const { token } = useAuth();
  const [todayTask, setTodayTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    fetchTodayTask();
  }, []);

  const fetchTodayTask = async () => {
    setLoading(true);
    setMessage('');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/premium-tasks/today`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'No task for today');
      setTodayTask(data);
    } catch (err) {
      setMessage(err.message);
    } finally {
      setLoading(false);
    }
  };

  const markTaskComplete = async (status) => {
    if (!todayTask) return;
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/premium-tasks/${todayTask.taskId}/mark`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ 
          date: new Date().toISOString(), 
          status: status,
          dayNumber: todayTask.dayNumber
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to update task');
      
      setShowSuccess(true);
      setMessage(status === 'completed' ? 'Great job! Next day task sent to your phone!' : 'Schedule regenerated! Check your phone for the new plan.');
      
      // Refresh the task after a delay
      setTimeout(() => {
        fetchTodayTask();
        setShowSuccess(false);
      }, 3000);
      
    } catch (err) {
      setMessage(err.message);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const getDayEmoji = (dayNumber) => {
    const emojis = ['🎯', '🚀', '💪', '🔥', '⭐', '🌟', '💎', '🏆', '🎉', '✨'];
    return emojis[(dayNumber - 1) % emojis.length];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Top Bar */}
      <motion.div 
        className="relative w-full bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <div className="max-w-7xl mx-auto px-6 py-6">
          <motion.div 
            className="flex items-center justify-center gap-3"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <motion.div
              className="p-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl shadow-lg"
              whileHover={{ scale: 1.1, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <SparklesIcon className="w-6 h-6 text-white" />
            </motion.div>
            <div className="text-center">
              <h1 className="text-2xl font-bold bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                Your AI Roadmap
              </h1>
              <p className="text-sm text-slate-600 mt-1">Powered by DeepSeek Intelligence</p>
            </div>
            <motion.div
              className="p-2 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl shadow-lg"
              whileHover={{ scale: 1.1, rotate: -5 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <CalendarIcon className="w-6 h-6 text-white" />
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Main Layout */}
      <motion.div 
        className="max-w-7xl mx-auto p-6"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.3 }}
      >
        <div className="grid grid-cols-12 gap-8 min-h-[calc(100vh-140px)]">
          {/* Sidebar - 30% width */}
          <motion.div 
            className="col-span-4"
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.5 }}
          >
            <Sidebar />
          </motion.div>

          {/* Main Content Area - 70% width */}
          <motion.div 
            className="col-span-8"
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            {/* Success Message */}
            {showSuccess && (
              <motion.div 
                className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <div className="flex items-center gap-3">
                  <CheckCircleIcon className="w-5 h-5 text-green-500" />
                  <p className="text-green-700 font-medium">{message}</p>
                </div>
              </motion.div>
            )}

            {/* Error Message */}
            {message && !showSuccess && (
              <motion.div 
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <div className="flex items-center gap-3">
                  <XCircleIcon className="w-5 h-5 text-red-500" />
                  <p className="text-red-700">{message}</p>
                </div>
              </motion.div>
            )}

            {/* Today's Task */}
            <motion.div 
              className="bg-white/70 backdrop-blur-xl border border-white/20 rounded-2xl shadow-xl p-8"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.8 }}
            >
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                    {getGreeting()}, let's make today productive!
                  </h2>
                  <p className="text-slate-600 mt-1">Your AI-generated task for today</p>
                </div>
                {todayTask && (
                  <div className="text-right">
                    <div className="text-3xl">{getDayEmoji(todayTask.dayNumber)}</div>
                    <div className="text-sm text-slate-500">Day {todayTask.dayNumber}</div>
                  </div>
                )}
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500 mx-auto mb-4"></div>
                  <p className="text-slate-600">Loading your roadmap...</p>
                </div>
              ) : !todayTask ? (
                <div className="text-center py-12">
                  <CalendarIcon className="h-16 w-16 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-slate-700 mb-2">No active roadmap</h3>
                  <p className="text-slate-500">Create a new AI schedule to get started.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Current Day Task */}
                  <motion.div
                    className="p-6 bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-xl"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 }}
                  >
                    <div className="flex items-start gap-4">
                      <div className="flex-shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">{todayTask.dayNumber}</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-semibold text-slate-800 mb-2">
                          {todayTask.subtask}
                        </h3>
                        <p className="text-slate-600 mb-4">{todayTask.motivationTip}</p>
                        
                        {/* Resources Section */}
                        {todayTask.resources && todayTask.resources.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                              📚 Learning Resources
                            </h4>
                            <div className="space-y-1">
                              {todayTask.resources.map((resource, index) => (
                                <div key={index} className="text-sm text-slate-600 bg-white/50 p-2 rounded">
                                  {resource}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Exercises Section */}
                        {todayTask.exercises && todayTask.exercises.length > 0 && (
                          <div className="mb-4">
                            <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                              💪 Practical Exercises
                            </h4>
                            <div className="space-y-1">
                              {todayTask.exercises.map((exercise, index) => (
                                <div key={index} className="text-sm text-slate-600 bg-white/50 p-2 rounded">
                                  {exercise}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {/* Notes Section */}
                        {todayTask.notes && (
                          <div className="mb-4">
                            <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                              📝 Learning Notes
                            </h4>
                            <div className="text-sm text-slate-600 bg-white/50 p-3 rounded">
                              {todayTask.notes}
                            </div>
                          </div>
                        )}
                        
                        {/* Action Buttons */}
                        <div className="flex gap-3">
                          <motion.button
                            onClick={() => markTaskComplete('completed')}
                            className="px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            ✅ Mark Complete
                          </motion.button>
                          <motion.button
                            onClick={() => markTaskComplete('skipped')}
                            className="px-6 py-3 bg-gradient-to-r from-orange-500 to-red-500 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            ⏭️ Skip & Reschedule
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Progress Stats */}
                  <motion.div
                    className="grid grid-cols-3 gap-4 p-6 bg-white/50 rounded-xl"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.0 }}
                  >
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">{todayTask.streak}</div>
                      <div className="text-sm text-slate-500">Current Streak</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{todayTask.bestStreak}</div>
                      <div className="text-sm text-slate-500">Best Streak</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{todayTask.completed}</div>
                      <div className="text-sm text-slate-500">Completed</div>
                    </div>
                  </motion.div>

                  {/* Task Info */}
                  <motion.div
                    className="p-4 bg-slate-50 rounded-xl"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.1 }}
                  >
                    <h4 className="font-semibold text-slate-700 mb-2">Roadmap: {todayTask.title}</h4>
                    <p className="text-sm text-slate-600">{todayTask.description}</p>
                  </motion.div>
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
} 