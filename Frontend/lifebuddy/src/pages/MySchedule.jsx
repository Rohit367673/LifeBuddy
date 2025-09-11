import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { motion } from 'framer-motion';
import { CheckCircleIcon, ClockIcon, CalendarIcon, SparklesIcon, XCircleIcon, BellIcon, PlayCircleIcon, LinkIcon } from '@heroicons/react/24/outline';
import { Sidebar } from '../components/figma/Sidebar';
import { getApiUrl } from '../utils/config';

export default function MySchedule() {
  const { token, user, loading: authLoading } = useAuth();
  const [todayTask, setTodayTask] = useState(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [notificationPlatform, setNotificationPlatform] = useState('');
  const [showEndConfirm, setShowEndConfirm] = useState(false);

  // On mount: try to restore cached schedule immediately for better UX
  useEffect(() => {
    try {
      const cached = localStorage.getItem('LB_TODAY_TASK');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object') {
          setTodayTask(parsed);
          setNotificationPlatform(parsed.notificationPlatform || '');
          setLoading(false);
        }
      }
    } catch (_) {}
  }, []);

  // Fetch when token is ready or changes
  useEffect(() => {
    if (!authLoading && token) {
      fetchTodayTask();
    }
  }, [authLoading, token]);

  // Force refresh when coming from productivity page
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const timestamp = urlParams.get('t');
    if (timestamp) {
      // Clear the URL parameter
      window.history.replaceState({}, document.title, window.location.pathname);
      // Force a fresh fetch
      setTimeout(() => {
        fetchTodayTask();
      }, 500);
    }
  }, []);

  const fetchTodayTask = async () => {
    setLoading(true);
    setMessage('');
    console.log('🔍 Fetching today task...');
    try {
      const apiBase = await getApiUrl();
      const res = await fetch(`${apiBase}/api/premium-tasks/today?t=${Date.now()}`, {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      console.log('📡 API Response status:', res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log('✅ API returned data:', data);
        setTodayTask(data);
        setNotificationPlatform(data.notificationPlatform || '');
        try { localStorage.setItem('LB_TODAY_TASK', JSON.stringify(data)); } catch (_) {}
      } else if (res.status === 404) {
        console.log('❌ No active task found (404)');
        // Fallback to cached schedule if present so user still sees their plan
        try {
          const cached = localStorage.getItem('LB_TODAY_TASK');
          if (cached) {
            const parsed = JSON.parse(cached);
            if (parsed) {
              setTodayTask(parsed);
              setNotificationPlatform(parsed.notificationPlatform || '');
              setMessage('Showing your last saved schedule.');
            } else {
              setTodayTask(null);
              setNotificationPlatform('');
              setMessage('');
            }
          } else {
            setTodayTask(null);
            setNotificationPlatform('');
            setMessage('');
          }
        } catch (_) {
          setTodayTask(null);
          setNotificationPlatform('');
          setMessage('');
        }
      } else {
        const data = await res.json();
        console.log('❌ API error:', data);
        throw new Error(data.message || 'Failed to fetch task');
      }
    } catch (err) {
      console.log('💥 Fetch error:', err.message);
      // If we have cached data, keep showing it and inform the user
      try {
        const cached = localStorage.getItem('LB_TODAY_TASK');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (parsed) {
            setTodayTask(parsed);
            setNotificationPlatform(parsed.notificationPlatform || '');
            setMessage('Showing your last saved schedule.');
          } else {
            setTodayTask(null);
            setNotificationPlatform('');
            setMessage(err.message);
          }
        } else {
          setTodayTask(null);
          setNotificationPlatform('');
          setMessage(err.message);
        }
      } catch (_) {
        setTodayTask(null);
        setNotificationPlatform('');
        setMessage(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const markTaskComplete = async (status) => {
    if (!todayTask) return;
    
    try {
      const apiBase = await getApiUrl();
      const res = await fetch(`${apiBase}/api/premium-tasks/${todayTask.taskId}/mark`, {
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

  const endSchedule = async () => {
    setLoading(true);
    setMessage('');
    console.log('🗑️ Ending schedule...');
    try {
      const apiBase = await getApiUrl();
      const res = await fetch(`${apiBase}/api/premium-tasks/current?t=${Date.now()}`, {
        method: 'DELETE',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      });
      
      console.log('🗑️ Delete response status:', res.status);
      
      if (res.ok) {
        console.log('✅ Schedule ended successfully');
        // Immediately clear all state
        setTodayTask(null);
        setNotificationPlatform('');
        setMessage('Schedule ended successfully. You can now create a new schedule.');
        
        // Force multiple refreshes to ensure data is cleared
        setTimeout(() => {
          console.log('🔄 First refresh...');
          fetchTodayTask();
        }, 1000);
        
        setTimeout(() => {
          console.log('🔄 Second refresh...');
          fetchTodayTask();
        }, 3000);
        
        // Final page reload after 5 seconds
        setTimeout(() => {
          console.log('🔄 Final page reload...');
          window.location.reload();
        }, 5000);
      } else {
        const data = await res.json();
        console.log('❌ Delete error:', data);
        throw new Error(data.message || 'Failed to end schedule');
      }
    } catch (err) {
      console.log('💥 End schedule error:', err.message);
      setMessage(err.message);
    } finally {
      setShowEndConfirm(false);
      setLoading(false);
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

  // --- Perplexity-style helpers ---
  const getYouTubeId = (url) => {
    try {
      const u = new URL(url);
      if (u.hostname.includes('youtu.be')) {
        return u.pathname.replace('/', '');
      }
      if (u.hostname.includes('youtube.com')) {
        const id = u.searchParams.get('v');
        if (id) return id;
        // handle shorts or embed
        const parts = u.pathname.split('/').filter(Boolean);
        if (parts[0] === 'shorts' || parts[0] === 'embed') return parts[1];
      }
    } catch (_) {}
    return '';
  };

  const parseResourceItem = (item) => {
    try {
      let title = '';
      let url = '';
      if (!item) return null;
      if (typeof item === 'string') {
        // markdown style [Text](URL)
        const md = item.match(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/);
        if (md) {
          title = md[1].trim();
          url = md[2].trim();
        } else if (/^https?:\/\//i.test(item.trim())) {
          url = item.trim();
        } else {
          // Might be plain text; ignore if no URL
          return null;
        }
      } else if (typeof item === 'object') {
        title = item.title || item.name || '';
        url = item.url || item.link || '';
      }
      if (!url) return null;
      const domain = new URL(url).hostname.replace(/^www\./, '');
      const videoId = getYouTubeId(url);
      const isYouTube = !!videoId;
      return { title, url, domain, isYouTube, videoId };
    } catch (_) {
      return null;
    }
  };

  const parsedResources = Array.isArray(todayTask?.resources)
    ? todayTask.resources.map(parseResourceItem).filter(Boolean)
    : [];
  const videoResources = parsedResources.filter(r => r.isYouTube);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 relative overflow-hidden">
      {/* Top Bar */}
      <motion.div 
        className="relative w-full bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-lg"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      >
        <div className="w-full px-2 py-6">
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
              <p className="text-sm text-slate-600 mt-1">Powered by LifeBuddy AI</p>
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
                    className="w-full p-6"
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
                  <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
                    <button
                      onClick={() => {
                        // Force a fresh navigation to productivity page
                        window.location.href = `/productivity?t=${Date.now()}`;
                      }}
                      className="inline-block px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold rounded-lg shadow-lg hover:from-purple-600 hover:to-pink-600 transition-all text-lg"
                    >
                      + Create New Schedule
                    </button>
                    <button
                      onClick={() => {
                        setLoading(true);
                        fetchTodayTask();
                      }}
                      className="inline-block px-4 py-3 bg-gray-500 text-white font-bold rounded-lg shadow-lg hover:bg-gray-600 transition-all text-sm"
                    >
                      🔄 Refresh
                    </button>
                    <button
                      onClick={() => {
                        console.log('🧹 Clearing all cache...');
                        localStorage.clear();
                        sessionStorage.clear();
                        window.location.reload();
                      }}
                      className="inline-block px-4 py-3 bg-red-500 text-white font-bold rounded-lg shadow-lg hover:bg-red-600 transition-all text-sm"
                    >
                      🧹 Clear Cache
                    </button>
                  </div>
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
                        {notificationPlatform === 'telegram' ? (
                          <div className="text-slate-600 mb-4 font-semibold">Full schedule sent to your Telegram!</div>
                        ) : (
                          <>
                            <p className="text-slate-600 mb-4">{todayTask.motivationTip || todayTask.motivation}</p>
                            {/* Perplexity-style Research Summary */}
                            {Array.isArray(todayTask.keyPoints) && todayTask.keyPoints.length > 0 && (
                              <div className="mb-6">
                                <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">🔎 Research Summary</h4>
                                <ul className="space-y-2 text-slate-700">
                                  {todayTask.keyPoints.slice(0, 5).map((pt, idx) => (
                                    <li key={idx} className="bg-white/50 p-2 rounded">{pt}</li>
                                  ))}
                                </ul>
                                {parsedResources.length > 0 && (
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {parsedResources.map((r, i) => (
                                      <a key={i} href={r.url} target="_blank" rel="noreferrer" className="text-xs px-2 py-1 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition">
                                        [{i + 1}] {r.domain}
                                      </a>
                                    ))}
                                  </div>
                                )}
                              </div>
                            )}
                            {/* Videos Section */}
                            {videoResources.length > 0 && (
                              <div className="mb-6">
                                <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">🎥 Videos</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                  {videoResources.map((v, i) => (
                                    <a key={i} href={v.url} target="_blank" rel="noreferrer" className="group relative rounded-xl overflow-hidden bg-black">
                                      <img src={`https://img.youtube.com/vi/${v.videoId}/hqdefault.jpg`} alt={v.title || 'YouTube Video'} className="w-full aspect-video object-cover opacity-90 group-hover:opacity-100 transition" />
                                      <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="bg-white/90 rounded-full p-3 shadow-lg group-hover:scale-110 transition">
                                          <PlayCircleIcon className="w-8 h-8 text-red-600" />
                                        </div>
                                      </div>
                                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3">
                                        <div className="text-white text-sm font-semibold">{v.title || v.domain}</div>
                                      </div>
                                    </a>
                                  ))}
                                </div>
                              </div>
                            )}
                            {/* Sources Section */}
                            {parsedResources.length > 0 && (
                              <div className="mb-4">
                                <h4 className="font-semibold text-slate-800 mb-2 flex items-center gap-2">📚 Sources</h4>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                  {parsedResources.map((r, index) => (
                                    <a key={index} href={r.url} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 bg-white/70 rounded-xl border border-slate-200 hover:border-purple-300 hover:shadow-md transition">
                                      <img src={`https://www.google.com/s2/favicons?sz=64&domain_url=${encodeURIComponent(r.url)}`} alt="" className="w-5 h-5 rounded-sm" />
                                      <div className="flex-1 min-w-0">
                                        <div className="text-sm font-semibold text-slate-800 truncate">{r.title || r.domain}</div>
                                        <div className="text-xs text-slate-500 truncate">{r.domain}</div>
                                      </div>
                                      <LinkIcon className="w-5 h-5 text-slate-400 flex-shrink-0" />
                                    </a>
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
                            {/* Deep Dive Section */}
                            {todayTask.notes && (
                              <div className="mb-4">
                                <h4 className="font-semibold text-slate-700 mb-2 flex items-center gap-2">
                                  🧠 Deep Dive
                                </h4>
                                <div className="text-sm text-slate-600 bg-white/50 p-3 rounded">
                                  {todayTask.notes}
                                </div>
                              </div>
                            )}
                          </>
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
                          <motion.button
                            onClick={() => setShowEndConfirm(true)}
                            className="px-6 py-3 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg font-medium hover:shadow-lg transition-all duration-300"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            🛑 End Schedule
                          </motion.button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                  {/* Progress Stats & Task Info - Only show if not Telegram */}
                  {notificationPlatform !== 'telegram' && (
                    <>
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
                    </>
                  )}
                </div>
              )}
            </motion.div>
          </motion.div>
        </div>
      </motion.div>
      {/* End Schedule Confirmation Dialog */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full text-center">
            <h2 className="text-xl font-bold mb-4 text-red-600">End Schedule?</h2>
            <p className="mb-6 text-gray-700">Are you sure you want to end your current schedule? This action cannot be undone.</p>
            <div className="flex justify-center gap-4">
              <button
                className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300"
                onClick={() => setShowEndConfirm(false)}
              >
                Cancel
              </button>
              <button
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-red-500 to-pink-500 text-white font-bold hover:from-red-600 hover:to-pink-600"
                onClick={endSchedule}
              >
                Yes, End Schedule
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 