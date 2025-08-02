import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { motion } from 'framer-motion';
import { 
  CalendarIcon, 
  CheckCircleIcon, 
  ClockIcon,
  ExclamationTriangleIcon,
  TrophyIcon,
  SparklesIcon,
  FaceSmileIcon,
  PlusIcon,
  ChartBarIcon,
  BellIcon,
  CogIcon,
  UserGroupIcon,
  FireIcon,
  StarIcon,
  ArrowTrendingUpIcon,
  BookOpenIcon,
  HeartIcon
} from '@heroicons/react/24/outline';

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
  const [quickActions] = useState([
    { name: 'Add Event', icon: CalendarIcon, color: 'from-purple-500 to-pink-500', link: '/events/new' },
    { name: 'Create Task', icon: CheckCircleIcon, color: 'from-green-500 to-emerald-500', link: '/tasks/new' },
    { name: 'Track Mood', icon: HeartIcon, color: 'from-red-500 to-pink-500', link: '/mood' },
    { name: 'View Analytics', icon: ChartBarIcon, color: 'from-blue-500 to-indigo-500', link: '/analytics' },
    { name: 'My Schedule', icon: ClockIcon, color: 'from-yellow-500 to-orange-500', link: '/my-schedule' },
    { name: 'Settings', icon: CogIcon, color: 'from-gray-500 to-slate-500', link: '/settings' }
  ]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [streakInfo, setStreakInfo] = useState({ current: 0, longest: 0, type: 'tasks' });
  const [productivityScore, setProductivityScore] = useState(0);
  const [upcomingDeadlines, setUpcomingDeadlines] = useState([]);
  const [achievementProgress, setAchievementProgress] = useState([]);

  useEffect(() => {
    console.log('🎯 Dashboard component mounted');
    console.log('👤 User:', user);
    console.log('🔗 API URL:', import.meta.env.VITE_API_URL);
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      console.log('🔄 Loading dashboard data...');
      
      // Add timeout to prevent infinite loading
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Dashboard loading timeout')), 10000);
      });
      
      const promises = [
        loadStats(),
        loadPrevStats(),
        loadRecentEvents(),
        loadUpcomingTasks(),
        loadMotivationalMessage(),
        loadRecentAchievements(),
        loadRecentActivity(),
        loadStreakInfo(),
        loadProductivityScore(),
        loadUpcomingDeadlines(),
        loadAchievementProgress()
      ];
      
      await Promise.race([
        Promise.allSettled(promises),
        timeoutPromise
      ]);
      console.log('✅ Dashboard data loading completed');
    } catch (error) {
      console.error('❌ Error loading dashboard data:', error);
    } finally {
      console.log('🏁 Setting loading to false');
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      console.log('📊 Loading stats...');
      const token = await getFirebaseToken();
      console.log('🔑 Token available:', !!token);
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('📈 Stats response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('📊 Stats loaded:', data);
        setStats(data);
      } else {
        console.error('❌ Stats API error:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('❌ Error loading stats:', error);
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
        // Handle both object and string responses
        if (typeof data === 'object' && data.message) {
          // If message is an object, get its content
          if (typeof data.message === 'object' && data.message.content) {
            setMotivationalMessage(data.message.content);
          } else if (typeof data.message === 'string') {
            setMotivationalMessage(data.message);
          } else {
            setMotivationalMessage('Stay motivated and keep pushing forward!');
          }
        } else if (typeof data === 'string') {
          setMotivationalMessage(data);
        } else {
          setMotivationalMessage('Stay motivated and keep pushing forward!');
        }
      }
    } catch (error) {
      console.error('Error loading motivational message:', error);
      setMotivationalMessage('Stay motivated and keep pushing forward!');
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

  const loadRecentActivity = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/activity?limit=5`, {
        headers: {
          'Authorization': `Bearer ${await getFirebaseToken()}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setRecentActivity(data);
      }
    } catch (error) {
      console.error('Error loading recent activity:', error);
    }
  };

  const loadStreakInfo = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/streak`, {
        headers: {
          'Authorization': `Bearer ${await getFirebaseToken()}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setStreakInfo(data);
      }
    } catch (error) {
      console.error('Error loading streak info:', error);
    }
  };

  const loadProductivityScore = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/productivity-score`, {
        headers: {
          'Authorization': `Bearer ${await getFirebaseToken()}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setProductivityScore(data.score || 0);
      }
    } catch (error) {
      console.error('Error loading productivity score:', error);
    }
  };

  const loadUpcomingDeadlines = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks?status=pending&sort=dueDate&limit=5`, {
        headers: {
          'Authorization': `Bearer ${await getFirebaseToken()}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setUpcomingDeadlines(data);
      }
    } catch (error) {
      console.error('Error loading upcoming deadlines:', error);
    }
  };

  const loadAchievementProgress = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/achievements/progress`, {
        headers: {
          'Authorization': `Bearer ${await getFirebaseToken()}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAchievementProgress(data);
      }
    } catch (error) {
      console.error('Error loading achievement progress:', error);
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

  const getProductivityColor = (score) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProductivityBgColor = (score) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'Just now';
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'task_completed': return CheckCircleIcon;
      case 'event_created': return CalendarIcon;
      case 'mood_logged': return HeartIcon;
      case 'achievement_earned': return TrophyIcon;
      default: return SparklesIcon;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'task_completed': return 'text-green-600 bg-green-100';
      case 'event_created': return 'text-blue-600 bg-blue-100';
      case 'mood_logged': return 'text-red-600 bg-red-100';
      case 'achievement_earned': return 'text-yellow-600 bg-yellow-100';
      default: return 'text-purple-600 bg-purple-100';
    }
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
      <motion.header 
        className="relative z-10 flex flex-col items-center justify-center pt-24 pb-16 text-center"
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
      >
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-0 w-[60vw] h-[60vw] -translate-x-1/2 bg-gradient-to-br from-purple-400 via-pink-300 to-yellow-200 opacity-30 blur-3xl animate-pulse" />
        </div>
        <motion.h1 
          className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 via-pink-600 to-yellow-500 drop-shadow-lg mb-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          {getGreeting()}, {user?.displayName || user?.firstName || 'there'}!
        </motion.h1>
        <motion.p 
          className="text-lg text-gray-600 max-w-2xl mx-auto"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
        >
          Ready to make today amazing? Let's check your progress and stay motivated!
        </motion.p>
      </motion.header>

      {/* Main Content */}
      <motion.section 
        className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.6 }}
      >
        {loading ? (
          <motion.div 
            className="flex items-center justify-center py-20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {/* Stats Grid */}
            <motion.div 
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <motion.div 
                className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl"
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Events</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalEvents || 0}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl">
                    <CalendarIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>

              <motion.div 
                className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl"
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Completed Tasks</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.completedTasks || 0}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl">
                    <CheckCircleIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>

              <motion.div 
                className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl"
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Current Streak</p>
                    <p className="text-2xl font-bold text-gray-900">{streakInfo.current || 0}</p>
                  </div>
                  <div className="p-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl">
                    <FireIcon className="w-6 h-6 text-white" />
                  </div>
                </div>
              </motion.div>

              <motion.div 
                className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl"
                whileHover={{ scale: 1.05, y: -5 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Productivity Score</p>
                    <p className={`text-2xl font-bold ${getProductivityColor(productivityScore)}`}>{productivityScore}%</p>
                  </div>
                  <div className={`p-3 rounded-xl ${getProductivityBgColor(productivityScore)}`}>
                    <ArrowTrendingUpIcon className="w-6 h-6" />
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div 
              className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.0 }}
            >
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <SparklesIcon className="w-5 h-5 text-purple-500" />
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {quickActions.map((action, index) => (
                  <motion.a
                    key={action.name}
                    href={action.link}
                    className="flex flex-col items-center p-4 bg-gradient-to-r from-white/50 to-white/30 rounded-xl border border-white/20 hover:from-white/70 hover:to-white/50 transition-all duration-300"
                    whileHover={{ scale: 1.05, y: -2 }}
                    transition={{ type: 'spring', stiffness: 300, delay: index * 0.1 }}
                  >
                    <div className={`p-3 bg-gradient-to-r ${action.color} rounded-lg mb-2`}>
                      <action.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-sm font-medium text-gray-700 text-center">{action.name}</span>
                  </motion.a>
                ))}
              </div>
            </motion.div>

            {/* Productivity & Streak Section */}
            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.2 }}
            >
              {/* Productivity Overview */}
              <motion.div 
                className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl"
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <ArrowTrendingUpIcon className="w-5 h-5 text-green-500" />
                  Productivity Overview
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">This Week</span>
                    <span className="font-semibold text-green-600">+12%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full" style={{ width: `${productivityScore}%` }}></div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span>Tasks: {stats.completedTasks || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span>Events: {stats.totalEvents || 0}</span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Streak Information */}
              <motion.div 
                className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl"
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <FireIcon className="w-5 h-5 text-orange-500" />
                  Streak Information
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Current Streak</span>
                    <span className="text-2xl font-bold text-orange-600">{streakInfo.current || 0} days</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Longest Streak</span>
                    <span className="text-lg font-semibold text-gray-800">{streakInfo.longest || 0} days</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <StarIcon className="w-5 h-5 text-yellow-500" />
                    <span className="text-sm text-gray-600">Keep it up! You're doing great!</span>
                  </div>
                </div>
              </motion.div>
            </motion.div>

            {/* Motivational Message */}
            {motivationalMessage && (
              <motion.div 
                className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-xl"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.0 }}
                whileHover={{ scale: 1.02 }}
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
            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.4 }}
            >
              {/* Recent Events */}
              <motion.div 
                className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl"
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-purple-500" />
                  Recent Events
                </h3>
                {recentEvents.length > 0 ? (
                  <div className="space-y-4">
                    {recentEvents.map((event) => (
                      <motion.div 
                        key={event._id} 
                        className="flex items-center gap-3 p-3 bg-white/50 rounded-xl"
                        whileHover={{ scale: 1.02, x: 5 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                      >
                        <div className={`w-3 h-3 rounded-full ${getStatusColor(event.status)}`}></div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{event.title}</p>
                          <p className="text-sm text-gray-600">{new Date(event.date).toLocaleDateString()}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No recent events</p>
                )}
              </motion.div>

              {/* Upcoming Tasks */}
              <motion.div 
                className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl"
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <ClockIcon className="w-5 h-5 text-blue-500" />
                  Upcoming Tasks
                </h3>
                {upcomingTasks.length > 0 ? (
                  <div className="space-y-4">
                    {upcomingTasks.map((task) => (
                      <motion.div 
                        key={task._id} 
                        className="flex items-center gap-3 p-3 bg-white/50 rounded-xl"
                        whileHover={{ scale: 1.02, x: 5 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                      >
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
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No upcoming tasks</p>
                )}
              </motion.div>
            </motion.div>

            {/* Recent Activity and Upcoming Deadlines */}
            <motion.div 
              className="grid grid-cols-1 lg:grid-cols-2 gap-8"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 1.6 }}
            >
              {/* Recent Activity */}
              <motion.div 
                className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl"
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BellIcon className="w-5 h-5 text-blue-500" />
                  Recent Activity
                </h3>
                {recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivity.map((activity, index) => {
                      const ActivityIcon = getActivityIcon(activity.type);
                      return (
                        <motion.div 
                          key={activity._id || index}
                          className="flex items-center gap-3 p-3 bg-white/50 rounded-xl"
                          whileHover={{ scale: 1.02, x: 5 }}
                          transition={{ type: 'spring', stiffness: 300 }}
                        >
                          <div className={`p-2 rounded-lg ${getActivityColor(activity.type)}`}>
                            <ActivityIcon className="w-4 h-4" />
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{activity.description}</p>
                            <p className="text-sm text-gray-600">{formatTimeAgo(activity.createdAt)}</p>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No recent activity</p>
                )}
              </motion.div>

              {/* Upcoming Deadlines */}
              <motion.div 
                className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl"
                whileHover={{ scale: 1.02 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <ExclamationTriangleIcon className="w-5 h-5 text-red-500" />
                  Upcoming Deadlines
                </h3>
                {upcomingDeadlines.length > 0 ? (
                  <div className="space-y-3">
                    {upcomingDeadlines.map((task) => (
                      <motion.div 
                        key={task._id}
                        className="flex items-center gap-3 p-3 bg-white/50 rounded-xl"
                        whileHover={{ scale: 1.02, x: 5 }}
                        transition={{ type: 'spring', stiffness: 300 }}
                      >
                        <div className="p-2 bg-red-100 rounded-lg">
                          <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{task.title}</p>
                          <p className="text-sm text-red-600">Due: {new Date(task.dueDate).toLocaleDateString()}</p>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4">No upcoming deadlines</p>
                )}
              </motion.div>
            </motion.div>

            {/* Recent Achievements */}
            {recentAchievements.length > 0 && (
              <motion.div 
                className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 1.8 }}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <TrophyIcon className="w-5 h-5 text-yellow-500" />
                  Recent Achievements
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {recentAchievements.map((achievement) => (
                    <motion.div 
                      key={achievement._id} 
                      className="flex items-center gap-3 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-yellow-200"
                      whileHover={{ scale: 1.05, y: -2 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <div className="p-2 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-lg">
                        <TrophyIcon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{achievement.title}</p>
                        <p className="text-sm text-gray-600">{achievement.description}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Achievement Progress */}
            {achievementProgress.length > 0 && (
              <motion.div 
                className="bg-white/80 backdrop-blur-xl border border-white/20 rounded-2xl p-6 shadow-xl"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, delay: 2.0 }}
              >
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <BookOpenIcon className="w-5 h-5 text-purple-500" />
                  Achievement Progress
                </h3>
                <div className="space-y-4">
                  {achievementProgress.slice(0, 3).map((achievement) => (
                    <motion.div 
                      key={achievement._id}
                      className="p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-xl border border-purple-200"
                      whileHover={{ scale: 1.02 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-gray-900">{achievement.title}</span>
                        <span className="text-sm text-gray-600">{achievement.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-purple-400 to-blue-600 h-2 rounded-full" 
                          style={{ width: `${achievement.progress}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-gray-600 mt-2">{achievement.description}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Summary Section */}
            <motion.div 
              className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl p-6 text-white shadow-xl"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 2.2 }}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/20 rounded-xl">
                  <UserGroupIcon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Your LifeBuddy Summary</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-white/80">Total Events</p>
                      <p className="text-xl font-bold">{stats.totalEvents || 0}</p>
                    </div>
                    <div>
                      <p className="text-white/80">Completed Tasks</p>
                      <p className="text-xl font-bold">{stats.completedTasks || 0}</p>
                    </div>
                    <div>
                      <p className="text-white/80">Current Streak</p>
                      <p className="text-xl font-bold">{streakInfo.current || 0} days</p>
                    </div>
                    <div>
                      <p className="text-white/80">Productivity</p>
                      <p className="text-xl font-bold">{productivityScore}%</p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </motion.section>
    </div>
  );
};

export default Dashboard; 