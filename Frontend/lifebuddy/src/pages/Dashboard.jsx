import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  CalendarIcon, 
  CheckCircleIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  TrophyIcon,
  SparklesIcon,
  FaceSmileIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { user, getFirebaseToken } = useAuth();
  const { isDarkMode } = useTheme();
  const [motivationalMessage, setMotivationalMessage] = useState(null);
  const [recentAchievements, setRecentAchievements] = useState([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    activeEvents: 0,
    completedTasks: 0,
    pendingTasks: 0,
    overdueTasks: 0,
    moodStreak: 0,
    totalPoints: 0
  });
  const [prevStats, setPrevStats] = useState({
    completedTasks: 0,
    totalPoints: 0
  });
  const [recentEvents, setRecentEvents] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [completingTaskId, setCompletingTaskId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadStats(),
        loadPrevStats(),
        loadRecentEvents(),
        loadUpcomingTasks(),
        loadMotivationalMessage(),
        loadRecentAchievements()
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/stats`, {
        headers: {
          'Authorization': `Bearer ${await getFirebaseToken()}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadRecentEvents = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/events?limit=3`, {
        headers: {
          'Authorization': `Bearer ${await getFirebaseToken()}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setRecentEvents(data.events || []);
      }
    } catch (error) {
      console.error('Error loading recent events:', error);
    }
  };

  const loadUpcomingTasks = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks?limit=5&status=pending`, {
        headers: {
          'Authorization': `Bearer ${await getFirebaseToken()}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUpcomingTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Error loading upcoming tasks:', error);
    }
  };

  const loadMotivationalMessage = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/motivational/daily`, {
        headers: {
          'Authorization': `Bearer ${await getFirebaseToken()}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setMotivationalMessage(data.message);
      }
    } catch (error) {
      console.error('Error loading motivational message:', error);
    }
  };

  const loadRecentAchievements = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/achievements/recent/list?limit=3`, {
        headers: {
          'Authorization': `Bearer ${await getFirebaseToken()}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setRecentAchievements(data);
      }
    } catch (error) {
      console.error('Error loading recent achievements:', error);
    }
  };

  // Fetch previous period stats for analytics (e.g., previous week)
  const loadPrevStats = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/stats?period=prev`, {
        headers: {
          'Authorization': `Bearer ${await getFirebaseToken()}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setPrevStats({
          completedTasks: data.completedTasks || 0,
          totalPoints: data.totalPoints || 0
        });
      }
    } catch (error) {
      console.error('Error loading previous stats:', error);
    }
  };

  // Calculate percentage change
  const getPercentChange = (current, prev) => {
    if (prev === 0 && current === 0) return 0;
    if (prev === 0) return 100;
    return Math.round(((current - prev) / Math.max(prev, 1)) * 100);
  };

  // UI badge for percent change
  const PercentBadge = ({ percent }) => {
    if (percent > 0) return <span className="ml-2 text-green-600 bg-green-100 px-2 py-0.5 rounded-full text-xs font-semibold">▲ {percent}%</span>;
    if (percent < 0) return <span className="ml-2 text-red-600 bg-red-100 px-2 py-0.5 rounded-full text-xs font-semibold">▼ {Math.abs(percent)}%</span>;
    return <span className="ml-2 text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full text-xs font-semibold">0%</span>;
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Good morning';
    if (hour >= 12 && hour < 17) return 'Good afternoon';
    if (hour >= 17 && hour < 21) return 'Good evening';
    return 'Good night';
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'bg-success-100 text-success-800';
      case 'in-progress': return 'bg-primary-100 text-primary-800';
      case 'planning': return 'bg-warning-100 text-warning-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getBadgeColor = (badge) => {
    switch (badge) {
      case 'bronze': return 'bg-amber-100 text-amber-800';
      case 'silver': return 'bg-gray-100 text-gray-800';
      case 'gold': return 'bg-yellow-100 text-yellow-800';
      case 'platinum': return 'bg-blue-100 text-blue-800';
      case 'diamond': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Mark a task as complete
  const markTaskComplete = async (taskId) => {
    setCompletingTaskId(taskId);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getFirebaseToken()}`
        },
        body: JSON.stringify({ status: 'completed' })
      });
      if (res.ok) {
        await loadUpcomingTasks();
        await loadStats();
      }
    } catch (err) {
      // Optionally show error
    } finally {
      setCompletingTaskId(null);
    }
  };

  return (
    <div className="bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 min-h-screen">
      {/* Header Section */}
      <header className="relative z-10 flex flex-col items-center justify-center pt-24 pb-16 text-center">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-0 w-[60vw] h-[60vw] -translate-x-1/2 bg-gradient-to-br from-purple-400 via-pink-300 to-yellow-200 opacity-30 blur-3xl animate-pulse" />
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 via-pink-600 to-yellow-500 drop-shadow-lg mb-4">
          {getGreeting()}, {user?.displayName || user?.firstName || 'there'}!
        </h1>
        <p className="text-xl sm:text-2xl text-gray-700 max-w-2xl mx-auto font-medium">
          Here's your productivity overview for today
        </p>
      </header>

      {/* Main Content */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Events</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalEvents}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl">
                    <CalendarIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed Tasks</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.completedTasks}</p>
                    <PercentBadge percent={getPercentChange(stats.completedTasks, prevStats.completedTasks)} />
                  </div>
                  <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                    <CheckCircleIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Points</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalPoints}</p>
                    <PercentBadge percent={getPercentChange(stats.totalPoints, prevStats.totalPoints)} />
                  </div>
                  <div className="p-3 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-xl">
                    <TrophyIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Mood Streak</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.moodStreak} days</p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-pink-500 to-rose-500 rounded-xl">
                    <FaceSmileIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Motivational Message */}
            {motivationalMessage && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-xl"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-white/20 rounded-xl">
                    <SparklesIcon className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold mb-2">Today's Motivation</h3>
                    <p className="text-white/90">{motivationalMessage}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Recent Events and Upcoming Tasks */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Recent Events */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-purple-500" />
                  Recent Events
                </h3>
                {recentEvents.length > 0 ? (
                  <div className="space-y-4">
                    {recentEvents.map((event) => (
                      <div key={event._id} className="flex items-center gap-3 p-3 bg-white/50 rounded-xl">
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(event.status)}`}></div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{event.title}</p>
                          <p className="text-sm text-gray-600">{new Date(event.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No recent events</p>
                )}
              </motion.div>

              {/* Upcoming Tasks */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.6 }}
                className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <ClockIcon className="w-5 h-5 text-blue-500" />
                  Upcoming Tasks
                </h3>
                {upcomingTasks.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingTasks.map((task) => (
                      <div key={task._id} className="flex items-center gap-3 p-3 bg-white/50 rounded-xl">
                        <button
                          onClick={() => markTaskComplete(task._id)}
                          disabled={completingTaskId === task._id}
                          className="w-5 h-5 border-2 border-gray-300 rounded-full hover:border-purple-500 transition-colors"
                        >
                          {task.completed && <CheckCircleIcon className="w-5 h-5 text-purple-500" />}
                        </button>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{task.title}</p>
                          <p className="text-sm text-gray-600">{new Date(task.dueDate).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No upcoming tasks</p>
                )}
              </motion.div>
            </div>

            {/* Recent Achievements */}
            {recentAchievements.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
                className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl"
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrophyIcon className="w-5 h-5 text-yellow-500" />
                  Recent Achievements
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentAchievements.map((achievement) => (
                    <div key={achievement._id} className="flex items-center gap-3 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200">
                      <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg">
                        <TrophyIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{achievement.title}</p>
                        <p className="text-sm text-gray-600">{achievement.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>
        )}
      </section>
    </div>
  );
};

export default Dashboard; 