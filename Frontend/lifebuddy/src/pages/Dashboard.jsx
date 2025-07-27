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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-8">
      {/* Welcome Section with Motivational Message */}
      <motion.div
        className="card glassmorphism-card"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
      >
        <div className="card-body">
          <div className="flex flex-col lg:flex-row items-start justify-between gap-4">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                {getGreeting()}, {user?.displayName || 'there'}! 👋
              </h1>
              <p className="mt-2 text-gray-600 text-sm sm:text-base">
                Let's make today productive. You have {stats.pendingTasks} tasks to complete.
              </p>
            </div>
            {motivationalMessage && (
              <motion.div
                className="w-full lg:w-auto lg:ml-6 p-3 sm:p-4 bg-gradient-to-r from-purple-200/60 to-blue-200/60 rounded-lg border border-purple-200 shadow-lg glassmorphism-card"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <div className="flex items-start space-x-2 sm:space-x-3">
                  <SparklesIcon className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600 flex-shrink-0 mt-1 animate-pulse" />
                  <div>
                    <p className="text-xs sm:text-sm font-medium text-purple-900 mb-1">Today's Inspiration</p>
                    <p className="text-xs sm:text-sm text-purple-800 italic">"{motivationalMessage.content}"</p>
                    {motivationalMessage.author && (
                      <p className="text-xs text-purple-600 mt-1">— {motivationalMessage.author}</p>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
        {/* Stat Card Example */}
        <motion.div
          className="card glassmorphism-card hover:shadow-2xl transition-all duration-300"
          whileHover={{ scale: 1.04, boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)' }}
        >
          <div className="card-body p-4 sm:p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <motion.div
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center shadow-lg"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <CalendarIcon className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                </motion.div>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm font-medium text-gray-500">Active Events</p>
                <motion.p
                  className="text-lg sm:text-2xl font-semibold text-gray-900"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {stats.activeEvents}
                </motion.p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="card glassmorphism-card hover:shadow-2xl transition-all duration-300"
          whileHover={{ scale: 1.04, boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)' }}
        >
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <motion.div
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg animate-pulse"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <CheckCircleIcon className="h-8 w-8 text-white" />
                </motion.div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed Tasks</p>
                <motion.p
                  className="text-2xl font-semibold text-gray-900 flex items-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {stats.completedTasks}
                  <PercentBadge percent={getPercentChange(stats.completedTasks, prevStats.completedTasks)} />
                </motion.p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="card glassmorphism-card hover:shadow-2xl transition-all duration-300"
          whileHover={{ scale: 1.04, boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)' }}
        >
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <motion.div
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-pink-500 flex items-center justify-center shadow-lg"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <FaceSmileIcon className="h-8 w-8 text-white" />
                </motion.div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Mood Streak</p>
                <motion.p
                  className="text-2xl font-semibold text-gray-900"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {stats.moodStreak} days
                </motion.p>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="card glassmorphism-card hover:shadow-2xl transition-all duration-300"
          whileHover={{ scale: 1.04, boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)' }}
        >
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <motion.div
                  className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-yellow-500 flex items-center justify-center shadow-lg animate-pulse"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <TrophyIcon className="h-8 w-8 text-white" />
                </motion.div>
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Points</p>
                <motion.p
                  className="text-2xl font-semibold text-gray-900 flex items-center"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  {stats.totalPoints}
                  <PercentBadge percent={getPercentChange(stats.totalPoints, prevStats.totalPoints)} />
                </motion.p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Recent Events and Upcoming Tasks */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Events */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Recent Events</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {recentEvents.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No events yet. Create your first event to get started!</p>
              ) : (
                recentEvents.map((event) => (
                  <div key={event._id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className="text-sm font-medium text-gray-900">{event.title}</h4>
                      <div className="flex items-center mt-1">
                        <span className={`badge ${getStatusColor(event.status)}`}>
                          {event.status.replace('-', ' ')}
                        </span>
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm text-gray-500">{event.progress}%</div>
                      <div className="progress-bar mt-1">
                        <div 
                          className="progress-fill-primary" 
                          style={{ width: `${event.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4">
              <a href="/events" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                View all events →
              </a>
            </div>
          </div>
        </div>

        {/* Upcoming Tasks */}
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Tasks</h3>
          </div>
          <div className="card-body">
            <div className="space-y-4">
              {upcomingTasks.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No upcoming tasks. Add some tasks to get organized!</p>
              ) : (
                upcomingTasks.map((task) => (
                  <div key={task._id} className="flex items-center justify-between">
                    <div className="flex-1">
                      <h4 className={`text-sm font-medium ${task.dueDate && new Date(task.dueDate) < new Date() ? 'text-red-600' : 'text-gray-900'}`}>{task.title}</h4>
                      {task.event && (
                        <p className="text-sm text-gray-500">{task.event}</p>
                      )}
                    </div>
                    <div className="ml-4 flex items-center gap-2">
                      <div className="text-sm text-gray-500">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}</div>
                     <button
                       className={`ml-2 px-3 py-1 rounded bg-green-500 text-white text-xs font-semibold hover:bg-green-600 transition-all ${completingTaskId === task._id ? 'opacity-60 cursor-wait' : ''}`}
                       disabled={completingTaskId === task._id}
                       onClick={() => markTaskComplete(task._id)}
                     >
                       {completingTaskId === task._id ? (
                         <span className="inline-block w-4 h-4 border-2 border-white border-t-green-200 rounded-full animate-spin align-middle"></span>
                       ) : (
                         'Mark Complete'
                       )}
                     </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-4">
              <a href="/tools" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                View all tasks →
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Achievements */}
      {recentAchievements.length > 0 && (
        <div className="card">
          <div className="card-header">
            <h3 className="text-lg font-semibold text-gray-900">Recent Achievements</h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentAchievements.map((achievement) => (
                <div key={achievement._id} className="flex items-center space-x-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                  <div className="flex-shrink-0">
                    <span className="text-2xl">{achievement.icon}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900">{achievement.title}</h4>
                    <p className="text-xs text-gray-600">{achievement.description}</p>
                    <div className="flex items-center mt-1">
                      <span className={`badge ${getBadgeColor(achievement.badge)}`}>
                        {achievement.badge}
                      </span>
                      <span className="text-xs text-gray-500 ml-2">+{achievement.points} pts</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4">
              <a href="/achievements" className="text-sm font-medium text-primary-600 hover:text-primary-500">
                View all achievements →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="card">
        <div className="card-header">
          <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
        </div>
        <div className="card-body">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <a
              href="/events/new"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <CalendarIcon className="h-6 w-6 text-primary-600 mr-3" />
              <span className="text-sm font-medium text-gray-900">New Event</span>
            </a>
            <a
              href="/tools"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <CheckCircleIcon className="h-6 w-6 text-success-600 mr-3" />
              <span className="text-sm font-medium text-gray-900">Add Task</span>
            </a>
            <a
              href="/tools?tab=mood"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FaceSmileIcon className="h-6 w-6 text-warning-600 mr-3" />
              <span className="text-sm font-medium text-gray-900">Log Mood</span>
            </a>
            <a
              href="/analytics"
              className="flex items-center p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ClockIcon className="h-6 w-6 text-gray-600 mr-3" />
              <span className="text-sm font-medium text-gray-900">View Analytics</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 