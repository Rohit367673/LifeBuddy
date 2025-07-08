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
  const [recentEvents, setRecentEvents] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadStats(),
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
              <div className="card">
        <div className="card-body">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900">
                {getGreeting()}, {user?.displayName || 'there'}! 👋
              </h1>
              <p className="mt-2 text-gray-600">
                Let's make today productive. You have {stats.pendingTasks} tasks to complete.
              </p>
            </div>
            {motivationalMessage && (
              <div className="ml-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                <div className="flex items-start space-x-3">
                  <SparklesIcon className="h-6 w-6 text-purple-600 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-sm font-medium text-purple-900 mb-1">Today's Inspiration</p>
                    <p className="text-sm text-purple-800 italic">"{motivationalMessage.content}"</p>
                    {motivationalMessage.author && (
                      <p className="text-xs text-purple-600 mt-1">— {motivationalMessage.author}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CalendarIcon className="h-8 w-8 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Events</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.activeEvents}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <CheckCircleIcon className="h-8 w-8 text-success-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completed Tasks</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.completedTasks}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <FaceSmileIcon className="h-8 w-8 text-warning-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Mood Streak</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.moodStreak} days</p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <TrophyIcon className="h-8 w-8 text-danger-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Points</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.totalPoints}</p>
              </div>
            </div>
          </div>
        </div>
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
                      <h4 className="text-sm font-medium text-gray-900">{task.title}</h4>
                      {task.event && (
                        <p className="text-sm text-gray-500">{task.event}</p>
                      )}
                    </div>
                    <div className="ml-4 text-sm text-gray-500">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date'}
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