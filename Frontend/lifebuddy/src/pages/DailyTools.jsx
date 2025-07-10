import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { usePremium } from '../context/PremiumContext';
import UsageLimitBanner from '../components/UsageLimitBanner';
import { 
  PlusIcon, 
  CheckCircleIcon, 
  ClockIcon,
  CalendarIcon,
  FaceSmileIcon,
  TrashIcon,
  PencilIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

const DailyTools = () => {
  const { user, getFirebaseToken } = useAuth();
  const { isDarkMode } = useTheme();
  const { checkUsageLimit, showUpgradePrompt } = usePremium();
  const [activeTab, setActiveTab] = useState('todo');
  const [tasks, setTasks] = useState([]);
  const [moodEntries, setMoodEntries] = useState([]);
  const [currentMood, setCurrentMood] = useState(null);
  const [showMoodModal, setShowMoodModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [loading, setLoading] = useState(false);

  // Task form state
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    dueDate: '',
    priority: 'medium',
    category: 'other'
  });

  // Mood form state
  const [moodForm, setMoodForm] = useState({
    mood: { emoji: '😊', rating: 7, label: 'good' },
    notes: '',
    activities: [],
    weather: 'sunny',
    sleepHours: 8,
    energyLevel: 7,
    stressLevel: 4
  });

  const moodOptions = [
    { emoji: '😊', rating: 7, label: 'good' },
    { emoji: '😄', rating: 9, label: 'great' },
    { emoji: '😌', rating: 8, label: 'calm' },
    { emoji: '😐', rating: 5, label: 'okay' },
    { emoji: '😔', rating: 3, label: 'meh' },
    { emoji: '😢', rating: 2, label: 'sad' },
    { emoji: '😡', rating: 1, label: 'angry' },
    { emoji: '🤔', rating: 4, label: 'confused' },
    { emoji: '😴', rating: 6, label: 'tired' },
    { emoji: '😍', rating: 10, label: 'excellent' },
    { emoji: '🤩', rating: 9, label: 'excited' },
    { emoji: '😎', rating: 8, label: 'confident' },
    { emoji: '🥳', rating: 9, label: 'celebrating' },
    { emoji: '😇', rating: 8, label: 'peaceful' },
    { emoji: '🤗', rating: 7, label: 'happy' }
  ];

  const activityOptions = [
    'work', 'exercise', 'social', 'family', 'hobby', 'rest', 'travel', 'learning', 'creative', 'health'
  ];

  const weatherOptions = [
    'sunny', 'cloudy', 'rainy', 'snowy', 'windy', 'stormy', 'foggy', 'clear'
  ];

  const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-orange-100 text-orange-800',
    urgent: 'bg-red-100 text-red-800'
  };

  // Load data on component mount
  useEffect(() => {
    loadTasks();
    loadMoodEntries();
    checkTodayMood();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks`, {
        headers: {
          'Authorization': `Bearer ${await getFirebaseToken()}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTasks(data.tasks || []);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadMoodEntries = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/mood`, {
        headers: {
          'Authorization': `Bearer ${await getFirebaseToken()}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setMoodEntries(data.moods || []);
      }
    } catch (error) {
      console.error('Error loading mood entries:', error);
    }
  };

  const checkTodayMood = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/mood/today/entry`, {
        headers: {
          'Authorization': `Bearer ${await getFirebaseToken()}`
        }
      });
      if (response.ok) {
        const mood = await response.json();
        setCurrentMood(mood);
      }
    } catch (error) {
      console.error('Error checking today\'s mood:', error);
    }
  };

  const addTask = async (e) => {
    e.preventDefault();
    
    // Check usage limit before adding task
    const taskLimit = checkUsageLimit('dailyTasks');
    if (taskLimit.isLimited) {
      showUpgradePrompt('dailyTasks', 'You\'ve reached your daily task limit. Upgrade for unlimited tasks!');
      return;
    }
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getFirebaseToken()}`
        },
        body: JSON.stringify(taskForm)
      });

      if (response.ok) {
        setTaskForm({
          title: '',
          description: '',
          dueDate: '',
          priority: 'medium',
          category: 'other'
        });
        setShowTaskModal(false);
        loadTasks();
      }
    } catch (error) {
      console.error('Error adding task:', error);
    }
  };

  const toggleTaskComplete = async (taskId, currentStatus) => {
    try {
      const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getFirebaseToken()}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        loadTasks();
      }
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const deleteTask = async (taskId) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${await getFirebaseToken()}`
        }
      });

      if (response.ok) {
        loadTasks();
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  const saveMood = async (e) => {
    e.preventDefault();
    
    // Check usage limit before adding mood entry
    const moodLimit = checkUsageLimit('moodEntries');
    if (moodLimit.isLimited) {
      showUpgradePrompt('moodEntries', 'You\'ve reached your mood history limit. Upgrade for full history!');
      return;
    }
    
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/mood`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getFirebaseToken()}`
        },
        body: JSON.stringify(moodForm)
      });

      if (response.ok) {
        setShowMoodModal(false);
        setMoodForm({
          mood: { emoji: '😊', rating: 7, label: 'good' },
          notes: '',
          activities: [],
          weather: 'sunny',
          sleepHours: 8,
          energyLevel: 7,
          stressLevel: 4
        });
        loadMoodEntries();
        checkTodayMood();
      }
    } catch (error) {
      console.error('Error saving mood:', error);
    }
  };

  const updateMood = async (e) => {
    e.preventDefault();
    if (!currentMood) return;

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/mood/${currentMood._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getFirebaseToken()}`
        },
        body: JSON.stringify(moodForm)
      });

      if (response.ok) {
        setShowMoodModal(false);
        loadMoodEntries();
        checkTodayMood();
      }
    } catch (error) {
      console.error('Error updating mood:', error);
    }
  };

  const toggleActivity = (activity) => {
    setMoodForm(prev => ({
      ...prev,
      activities: prev.activities.includes(activity)
        ? prev.activities.filter(a => a !== activity)
        : [...prev.activities, activity]
    }));
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const pendingTasks = tasks.filter(task => task.status !== 'completed');
  const completedTasks = tasks.filter(task => task.status === 'completed');

  return (
    <div className="space-y-6 mt-8">
      {/* Usage Limit Banner */}
      <UsageLimitBanner 
        limitType="dailyTasks"
        current={checkUsageLimit('dailyTasks').current}
        limit={checkUsageLimit('dailyTasks').limit}
      />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Daily Tools</h1>
          <p className="text-gray-600">{getGreeting()}, {user?.displayName || 'there'}!</p>
        </div>
        
        {/* Today's Mood Quick View */}
        <div className="flex items-center space-x-4">
          {currentMood ? (
            <div className="flex items-center space-x-2 bg-green-50 px-3 py-2 rounded-lg">
              <span className="text-2xl">{currentMood.mood.emoji}</span>
              <span className="text-sm text-green-700">Mood logged</span>
            </div>
          ) : (
            <button
              onClick={() => setShowMoodModal(true)}
              className="flex items-center space-x-2 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-lg transition-colors"
            >
              <FaceSmileIcon className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-blue-700">Log Mood</span>
            </button>
          )}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'todo', name: 'To-Do List', icon: CheckCircleIcon },
            { id: 'mood', name: 'Mood Tracker', icon: FaceSmileIcon },
            { id: 'calendar', name: 'Calendar', icon: CalendarIcon }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm ${
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
        {/* To-Do List Tab */}
        {activeTab === 'todo' && (
          <div className="space-y-6">
            {/* Add Task Button */}
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Tasks</h2>
              <button
                onClick={() => setShowTaskModal(true)}
                className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
              >
                <PlusIcon className="h-5 w-5" />
                <span>Add Task</span>
              </button>
            </div>

            {/* Tasks List */}
            <div className="space-y-4">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                </div>
              ) : pendingTasks.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No pending tasks</h3>
                  <p className="text-gray-600">Add a task to get started!</p>
                </div>
              ) : (
                pendingTasks.map((task) => (
                  <div
                    key={task._id}
                    className="flex items-center space-x-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <button
                      onClick={() => toggleTaskComplete(task._id, task.status)}
                      className={`flex-shrink-0 ${
                        task.status === 'completed' ? 'text-green-600' : 'text-gray-400 hover:text-green-600'
                      }`}
                    >
                      <CheckCircleIcon className="h-6 w-6" />
                    </button>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-sm font-medium ${
                        task.status === 'completed' ? 'text-gray-500 line-through' : 'text-gray-900'
                      }`}>
                        {task.title}
                      </h3>
                      {task.description && (
                        <p className="text-sm text-gray-500 mt-1">{task.description}</p>
                      )}
                      <div className="flex items-center space-x-2 mt-2">
                        {task.dueDate && (
                          <div className="flex items-center space-x-1 text-xs text-gray-500">
                            <ClockIcon className="h-4 w-4" />
                            <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                          </div>
                        )}
                        <span className={`badge ${priorityColors[task.priority]}`}>
                          {task.priority}
                        </span>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => deleteTask(task._id)}
                      className="flex-shrink-0 text-gray-400 hover:text-red-600 transition-colors"
                    >
                      <TrashIcon className="h-5 w-5" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Completed Tasks */}
            {completedTasks.length > 0 && (
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Completed Tasks</h3>
                <div className="space-y-2">
                  {completedTasks.map((task) => (
                    <div
                      key={task._id}
                      className="flex items-center space-x-4 p-3 bg-gray-50 border border-gray-200 rounded-lg"
                    >
                      <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="text-sm font-medium text-gray-500 line-through">{task.title}</h4>
                        <p className="text-xs text-gray-400">
                          Completed {task.completedAt ? new Date(task.completedAt).toLocaleDateString() : 'recently'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Mood Tracker Tab */}
        {activeTab === 'mood' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold text-gray-900">Mood Tracker</h2>
              {!currentMood && (
                <button
                  onClick={() => setShowMoodModal(true)}
                  className="flex items-center space-x-2 bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg transition-colors"
                >
                  <PlusIcon className="h-5 w-5" />
                  <span>Log Today's Mood</span>
                </button>
              )}
            </div>

            {/* Today's Mood */}
            {currentMood && (
              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Mood</h3>
                <div className="flex items-center space-x-4">
                  <span className="text-4xl">{currentMood.mood.emoji}</span>
                  <div>
                    <p className="text-lg font-medium text-gray-900 capitalize">{currentMood.mood.label}</p>
                    <p className="text-sm text-gray-600">Rating: {currentMood.mood.rating}/10</p>
                    {currentMood.notes && (
                      <p className="text-sm text-gray-600 mt-1">"{currentMood.notes}"</p>
                    )}
                  </div>
                  <button
                    onClick={() => setShowMoodModal(true)}
                    className="ml-auto text-primary-600 hover:text-primary-700"
                  >
                    <PencilIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            )}

            {/* Recent Mood Entries */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Moods</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {moodEntries.slice(0, 6).map((entry) => (
                  <div key={entry._id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-2xl">{entry.mood.emoji}</span>
                      <span className="text-xs text-gray-500">
                        {new Date(entry.date).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-gray-900 capitalize">{entry.mood.label}</p>
                    <p className="text-xs text-gray-600">Rating: {entry.mood.rating}/10</p>
                    {entry.notes && (
                      <p className="text-xs text-gray-500 mt-1 truncate">"{entry.notes}"</p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <div className="space-y-6">
            <h2 className="text-lg font-semibold text-gray-900">Calendar View</h2>
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <p className="text-gray-600 text-center py-8">
                Calendar view coming soon! This will show your tasks, events, and mood entries in a monthly calendar format.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add New Task</h3>
              <button
                onClick={() => setShowTaskModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={addTask} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={taskForm.title}
                  onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={taskForm.description}
                  onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows="3"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={taskForm.dueDate}
                  onChange={(e) => setTaskForm({ ...taskForm, dueDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={taskForm.priority}
                  onChange={(e) => setTaskForm({ ...taskForm, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowTaskModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  Add Task
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Mood Modal */}
      {showMoodModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {currentMood ? 'Update Today\'s Mood' : 'Log Today\'s Mood'}
              </h3>
              <button
                onClick={() => setShowMoodModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <form onSubmit={currentMood ? updateMood : saveMood} className="space-y-4">
              {/* Mood Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">How are you feeling?</label>
                <div className="grid grid-cols-5 gap-2">
                  {moodOptions.map((mood) => (
                    <button
                      key={mood.emoji}
                      type="button"
                      onClick={() => setMoodForm({ ...moodForm, mood })}
                      className={`p-3 rounded-lg text-2xl hover:bg-gray-100 transition-colors ${
                        moodForm.mood.emoji === mood.emoji ? 'bg-primary-100 border-2 border-primary-500' : ''
                      }`}
                    >
                      {mood.emoji}
                    </button>
                  ))}
                </div>
                <p className="text-sm text-gray-600 mt-2">
                  {moodForm.mood.label} ({moodForm.mood.rating}/10)
                </p>
              </div>
              
              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (optional)</label>
                <textarea
                  value={moodForm.notes}
                  onChange={(e) => setMoodForm({ ...moodForm, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows="3"
                  placeholder="How was your day?"
                />
              </div>
              
              {/* Activities */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Activities today</label>
                <div className="grid grid-cols-2 gap-2">
                  {activityOptions.map((activity) => (
                    <button
                      key={activity}
                      type="button"
                      onClick={() => toggleActivity(activity)}
                      className={`px-3 py-2 rounded-md text-sm transition-colors ${
                        moodForm.activities.includes(activity)
                          ? 'bg-primary-100 text-primary-700 border border-primary-300'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {activity.charAt(0).toUpperCase() + activity.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              
              {/* Weather */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Weather</label>
                <select
                  value={moodForm.weather}
                  onChange={(e) => setMoodForm({ ...moodForm, weather: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  {weatherOptions.map((weather) => (
                    <option key={weather} value={weather}>
                      {weather.charAt(0).toUpperCase() + weather.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              
              {/* Sleep Hours */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Sleep Hours</label>
                <input
                  type="number"
                  min="0"
                  max="24"
                  value={moodForm.sleepHours}
                  onChange={(e) => setMoodForm({ ...moodForm, sleepHours: parseInt(e.target.value) })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
              </div>
              
              {/* Energy Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Energy Level (1-10): {moodForm.energyLevel}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={moodForm.energyLevel}
                  onChange={(e) => setMoodForm({ ...moodForm, energyLevel: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
              
              {/* Stress Level */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Stress Level (1-10): {moodForm.stressLevel}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={moodForm.stressLevel}
                  onChange={(e) => setMoodForm({ ...moodForm, stressLevel: parseInt(e.target.value) })}
                  className="w-full"
                />
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowMoodModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
                >
                  {currentMood ? 'Update Mood' : 'Save Mood'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Usage Limit Banner */}
      {/* Removed duplicate usage limit banner - already shown at top */}
    </div>
  );
};

export default DailyTools; 