import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ChartBarIcon,
  CalendarIcon,
  CheckCircleIcon,
  FaceSmileIcon,
  TrophyIcon,
  ClockIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const Analytics = () => {
  const { user, getFirebaseToken } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30'); // days
  const [analyticsData, setAnalyticsData] = useState({
    overview: {},
    events: {},
    tasks: {},
    mood: {},
    achievements: {}
  });

  useEffect(() => {
    loadAnalyticsData();
  }, [timeRange]);

  const loadAnalyticsData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadOverviewData(),
        loadEventAnalytics(),
        loadTaskAnalytics(),
        loadMoodAnalytics(),
        loadAchievementAnalytics()
      ]);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadOverviewData = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/stats`, {
        headers: {
          'Authorization': `Bearer ${await getFirebaseToken()}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(prev => ({
          ...prev,
          overview: data
        }));
      }
    } catch (error) {
      console.error('Error loading overview data:', error);
    }
  };

  const loadEventAnalytics = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/events?limit=100`, {
        headers: {
          'Authorization': `Bearer ${await getFirebaseToken()}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const events = data.events || [];
        
        // Process event analytics
        const eventStats = {
          total: events.length,
          byStatus: {},
          byType: {},
          byMonth: {},
          averageProgress: 0
        };

        events.forEach(event => {
          // Status distribution
          eventStats.byStatus[event.status] = (eventStats.byStatus[event.status] || 0) + 1;
          
          // Type distribution
          const typeKey = event.eventType || event.type;
          eventStats.byType[typeKey] = (eventStats.byType[typeKey] || 0) + 1;
          
          // Monthly distribution
          const month = new Date(event.startDate).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
          eventStats.byMonth[month] = (eventStats.byMonth[month] || 0) + 1;
          
          // Average progress
          eventStats.averageProgress += event.progress || 0;
        });

        if (events.length > 0) {
          eventStats.averageProgress = Math.round(eventStats.averageProgress / events.length);
        }

        setAnalyticsData(prev => ({
          ...prev,
          events: eventStats
        }));
      }
    } catch (error) {
      console.error('Error loading event analytics:', error);
    }
  };

  const loadTaskAnalytics = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks?limit=100`, {
        headers: {
          'Authorization': `Bearer ${await getFirebaseToken()}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        const tasks = data.tasks || [];
        
        // Process task analytics
        const taskStats = {
          total: tasks.length,
          byStatus: {},
          byPriority: {},
          byCategory: {},
          completionRate: 0,
          overdueCount: 0
        };

        let completedTasks = 0;
        let overdueTasks = 0;

        tasks.forEach(task => {
          // Status distribution
          taskStats.byStatus[task.status] = (taskStats.byStatus[task.status] || 0) + 1;
          
          // Priority distribution
          taskStats.byPriority[task.priority] = (taskStats.byPriority[task.priority] || 0) + 1;
          
          // Category distribution
          taskStats.byCategory[task.category] = (taskStats.byCategory[task.category] || 0) + 1;
          
          // Completion tracking
          if (task.status === 'completed') {
            completedTasks++;
          }
          
          // Overdue tracking
          if (task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed') {
            overdueTasks++;
          }
        });

        taskStats.completionRate = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
        taskStats.overdueCount = overdueTasks;

        setAnalyticsData(prev => ({
          ...prev,
          tasks: taskStats
        }));
      }
    } catch (error) {
      console.error('Error loading task analytics:', error);
    }
  };

  const loadMoodAnalytics = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/mood/stats/overview`, {
        headers: {
          'Authorization': `Bearer ${await getFirebaseToken()}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(prev => ({
          ...prev,
          mood: data
        }));
      }
    } catch (error) {
      console.error('Error loading mood analytics:', error);
    }
  };

  const loadAchievementAnalytics = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/achievements/stats/overview`, {
        headers: {
          'Authorization': `Bearer ${await getFirebaseToken()}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setAnalyticsData(prev => ({
          ...prev,
          achievements: data
        }));
      }
    } catch (error) {
      console.error('Error loading achievement analytics:', error);
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: ChartBarIcon },
    { id: 'events', name: 'Events', icon: CalendarIcon },
    { id: 'tasks', name: 'Tasks', icon: CheckCircleIcon },
    { id: 'mood', name: 'Mood', icon: FaceSmileIcon },
    { id: 'achievements', name: 'Achievements', icon: TrophyIcon }
  ];

  const timeRangeOptions = [
    { value: '7', label: 'Last 7 days' },
    { value: '30', label: 'Last 30 days' },
    { value: '90', label: 'Last 90 days' },
    { value: '365', label: 'Last year' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600">Track your progress and insights</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          {timeRangeOptions.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.name}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="mt-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="card">
                <div className="card-body">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <CalendarIcon className="h-8 w-8 text-primary-600" />
                    </div>
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-500">Total Events</p>
                      <p className="text-2xl font-semibold text-gray-900">{analyticsData.overview.totalEvents || 0}</p>
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
                      <p className="text-2xl font-semibold text-gray-900">{analyticsData.overview.completedTasks || 0}</p>
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
                      <p className="text-2xl font-semibold text-gray-900">{analyticsData.overview.currentStreak || 0} days</p>
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
                      <p className="text-2xl font-semibold text-gray-900">{analyticsData.overview.totalPoints || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Productivity Insights */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">Productivity Insights</h3>
                </div>
                <div className="card-body">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Task Completion Rate</span>
                      <span className="text-sm font-medium text-gray-900">{analyticsData.tasks.completionRate || 0}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Average Event Progress</span>
                      <span className="text-sm font-medium text-gray-900">{analyticsData.events.averageProgress || 0}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Current Streak</span>
                      <span className="text-sm font-medium text-gray-900">{analyticsData.overview.currentStreak || 0} days</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
                </div>
                <div className="card-body">
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Created {analyticsData.overview.totalEvents || 0} events</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Completed {analyticsData.overview.completedTasks || 0} tasks</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Logged mood for {analyticsData.overview.currentStreak || 0} days</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Events Tab */}
        {activeTab === 'events' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">Event Status Distribution</h3>
                </div>
                <div className="card-body">
                  {Object.keys(analyticsData.events.byStatus || {}).length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No events data available</p>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(analyticsData.events.byStatus).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 capitalize">{status.replace('-', ' ')}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-primary-600 h-2 rounded-full"
                                style={{ width: `${(count / analyticsData.events.total) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">Event Types</h3>
                </div>
                <div className="card-body">
                  {Object.keys(analyticsData.events.byType || {}).length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No event types data available</p>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(analyticsData.events.byType).map(([type, count]) => (
                        <div key={type} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 capitalize">{type.replace('-', ' ')}</span>
                          <span className="text-sm font-medium text-gray-900">{count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tasks Tab */}
        {activeTab === 'tasks' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">Task Status</h3>
                </div>
                <div className="card-body">
                  {Object.keys(analyticsData.tasks.byStatus || {}).length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No tasks data available</p>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(analyticsData.tasks.byStatus).map(([status, count]) => (
                        <div key={status} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 capitalize">{status.replace('-', ' ')}</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-20 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-primary-600 h-2 rounded-full"
                                style={{ width: `${(count / analyticsData.tasks.total) * 100}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-gray-900">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">Task Priority</h3>
                </div>
                <div className="card-body">
                  {Object.keys(analyticsData.tasks.byPriority || {}).length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No priority data available</p>
                  ) : (
                    <div className="space-y-3">
                      {Object.entries(analyticsData.tasks.byPriority).map(([priority, count]) => (
                        <div key={priority} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 capitalize">{priority}</span>
                          <span className="text-sm font-medium text-gray-900">{count}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">Task Performance</h3>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">{analyticsData.tasks.completionRate || 0}%</div>
                    <div className="text-sm text-gray-600">Completion Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-600">{analyticsData.tasks.overdueCount || 0}</div>
                    <div className="text-sm text-gray-600">Overdue Tasks</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{analyticsData.tasks.total || 0}</div>
                    <div className="text-sm text-gray-600">Total Tasks</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Mood Tab */}
        {activeTab === 'mood' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">Mood Overview</h3>
                </div>
                <div className="card-body">
                  {analyticsData.mood.stats ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Average Rating</span>
                        <span className="text-lg font-semibold text-gray-900">
                          {analyticsData.mood.stats.averageRating ? Math.round(analyticsData.mood.stats.averageRating * 10) / 10 : 0}/10
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Total Entries</span>
                        <span className="text-lg font-semibold text-gray-900">{analyticsData.mood.stats.totalEntries || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Current Streak</span>
                        <span className="text-lg font-semibold text-gray-900">{analyticsData.mood.streak || 0} days</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No mood data available</p>
                  )}
                </div>
              </div>

              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">Mood Distribution</h3>
                </div>
                <div className="card-body">
                  {analyticsData.mood.moodDistribution && analyticsData.mood.moodDistribution.length > 0 ? (
                    <div className="space-y-3">
                      {analyticsData.mood.moodDistribution.slice(0, 5).map((item, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-gray-600 capitalize">{item._id}</span>
                          <span className="text-sm font-medium text-gray-900">{item.count}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 text-center py-8">No mood distribution data available</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <div className="space-y-6">
            <div className="card">
              <div className="card-header">
                <h3 className="text-lg font-semibold text-gray-900">Achievement Progress</h3>
              </div>
              <div className="card-body">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary-600">{analyticsData.achievements.totalAchievements || 0}</div>
                    <div className="text-sm text-gray-600">Total Available</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{analyticsData.achievements.earnedAchievements || 0}</div>
                    <div className="text-sm text-gray-600">Earned</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-yellow-600">{analyticsData.achievements.totalPoints || 0}</div>
                    <div className="text-sm text-gray-600">Total Points</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{analyticsData.achievements.completionPercentage || 0}%</div>
                    <div className="text-sm text-gray-600">Completion</div>
                  </div>
                </div>
              </div>
            </div>

            {analyticsData.achievements.categoryStats && (
              <div className="card">
                <div className="card-header">
                  <h3 className="text-lg font-semibold text-gray-900">Achievement Categories</h3>
                </div>
                <div className="card-body">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(analyticsData.achievements.categoryStats).map(([category, stats]) => (
                      <div key={category} className="p-4 border border-gray-200 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-900 capitalize mb-2">{category}</h4>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-600">Progress</span>
                          <span className="text-xs text-gray-900">{stats.earned}/{stats.total}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-primary-600 h-2 rounded-full transition-all"
                            style={{ width: `${stats.total > 0 ? (stats.earned / stats.total) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Analytics; 