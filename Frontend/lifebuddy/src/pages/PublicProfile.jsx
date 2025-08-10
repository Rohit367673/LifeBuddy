import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserIcon, ShareIcon, TrophyIcon, CalendarIcon, StarIcon } from '@heroicons/react/24/outline';
import badge2 from '../assets/svg/badge-2.svg';
import badge3 from '../assets/svg/badge-3.svg';
import badge4 from '../assets/svg/badge-4.svg';
import badge5 from '../assets/svg/badge-5.svg';
import badge6 from '../assets/svg/badge-6.svg';
import badge7 from '../assets/svg/badge-7.svg';
import badge8 from '../assets/svg/badge-8.svg';
import badge9 from '../assets/svg/badge-9.svg';
import badge10 from '../assets/svg/badge-10.svg';

// Helper function to process Google avatar URL with multiple fallbacks
const processAvatarUrl = (url) => {
  if (!url) return null;
  
  // If it's a Google avatar URL, try different approaches
  if (url.includes('googleusercontent.com')) {
    // Try to remove any existing size parameters and use a standard size
    const cleanUrl = url.split('=')[0];
    // Try different size parameters
    return `${cleanUrl}=s96-c`;
  }
  
  return url;
};

// Helper function to create a fallback URL
const createFallbackUrl = (url) => {
  if (!url) return null;
  
  if (url.includes('googleusercontent.com')) {
    const cleanUrl = url.split('=')[0];
    // Try a different size parameter
    return `${cleanUrl}=s48-c`;
  }
  
  return url;
};

// Helper function to create a proxy URL for Google images
const createProxyUrl = (url) => {
  if (!url) return null;
  
  if (url.includes('googleusercontent.com')) {
    // Use a proxy service to bypass CORS issues
    return `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=96&h=96&fit=cover&output=webp`;
  }
  
  return url;
};

const badgeDefinitions = {
  'first_login': {
    name: 'Welcome Aboard!',
    description: 'Logged in for the first time',
    image: badge10,
    color: 'bg-blue-500',
    textColor: 'text-blue-500'
  },
  'first_task': {
    name: 'First Steps',
    description: 'Completed your first task',
    image: badge2,
    color: 'bg-yellow-500',
    textColor: 'text-yellow-500'
  },
  'task_streak': {
    name: 'Week Warrior',
    description: '7-day consistency streak',
    image: badge3,
    color: 'bg-orange-500',
    textColor: 'text-orange-500'
  },
  'mood_streak': {
    name: 'Monthly Master',
    description: '30-day consistency streak',
    image: badge7,
    color: 'bg-purple-500',
    textColor: 'text-purple-500'
  },
  'first_mood': {
    name: 'Mindful',
    description: 'Tracked mood for 7 days',
    image: badge5,
    color: 'bg-pink-500',
    textColor: 'text-pink-500'
  },
  'event_planner': {
    name: 'Event Organizer',
    description: 'Created 5 events',
    image: badge6,
    color: 'bg-blue-500',
    textColor: 'text-blue-500'
  },
  'first_event': {
    name: 'Event Champion',
    description: 'Created your first event',
    image: badge4,
    color: 'bg-green-500',
    textColor: 'text-green-500'
  },
  'consistency_king': {
    name: 'Consistency King',
    description: '100-day streak',
    image: badge9,
    color: 'bg-gradient-to-r from-purple-500 to-pink-500',
    textColor: 'text-purple-500'
  },
  'productivity_master': {
    name: 'Productivity Master',
    description: 'Completed 100 tasks',
    image: badge8,
    color: 'bg-indigo-500',
    textColor: 'text-indigo-500'
  },
  'perfect_week': {
    name: 'Perfect Week',
    description: 'Completed all planned tasks in a week',
    image: badge4,
    color: 'bg-green-500',
    textColor: 'text-green-500'
  },
  'early_bird': {
    name: 'Early Bird',
    description: 'Completed tasks before 9 AM for 5 days',
    image: badge3,
    color: 'bg-orange-500',
    textColor: 'text-orange-500'
  },
  'night_owl': {
    name: 'Night Owl',
    description: 'Completed tasks after 10 PM for 5 days',
    image: badge7,
    color: 'bg-purple-500',
    textColor: 'text-purple-500'
  },
  'social_butterfly': {
    name: 'Social Butterfly',
    description: 'Created 5 events with social activities',
    image: badge6,
    color: 'bg-blue-500',
    textColor: 'text-blue-500'
  },
  'fitness_freak': {
    name: 'Fitness Freak',
    description: 'Completed 20 fitness-related tasks',
    image: badge5,
    color: 'bg-pink-500',
    textColor: 'text-pink-500'
  },
  'bookworm': {
    name: 'Bookworm',
    description: 'Completed 10 learning-related tasks',
    image: badge2,
    color: 'bg-yellow-500',
    textColor: 'text-yellow-500'
  },
  'creative_soul': {
    name: 'Creative Soul',
    description: 'Completed 15 creative tasks',
    image: badge8,
    color: 'bg-indigo-500',
    textColor: 'text-indigo-500'
  },
  'organizer': {
    name: 'Organizer',
    description: 'Created 10 events with detailed checklists',
    image: badge4,
    color: 'bg-green-500',
    textColor: 'text-green-500'
  },
  'goal_setter': {
    name: 'Goal Setter',
    description: 'Set and completed 5 major life goals',
    image: badge9,
    color: 'bg-gradient-to-r from-purple-500 to-pink-500',
    textColor: 'text-purple-500'
  },
  'stress_manager': {
    name: 'Stress Manager',
    description: 'Logged mood for 50 days with stress management',
    image: badge10,
    color: 'bg-blue-500',
    textColor: 'text-blue-500'
  },
  'event_completed': {
    name: 'Event Champion',
    description: 'Completed your first major life event',
    image: badge6,
    color: 'bg-blue-500',
    textColor: 'text-blue-500'
  }
};

const PublicProfile = () => {
  const { identifier } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [achievementStats, setAchievementStats] = useState({});
  const [loginHistory, setLoginHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.body.classList.remove('dark'); // Always light mode for public profile
    fetchProfile();
    fetchAchievements();
    fetchLoginHistory();
  }, [identifier]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/users/profile/${identifier}`);
      if (response.status === 403) setError('This profile is private.');
      else if (response.status === 404) setError('Profile not found.');
      else if (!response.ok) setError('Failed to load profile.');
      else {
        const data = await response.json();
        setProfile(data);
      }
    } catch (err) {
      setError('Failed to load profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAchievements = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/achievements/public/${identifier}`);
      if (response.ok) {
        const data = await response.json();
        setAchievements(data.achievements || []);
        setAchievementStats(data.stats || {});
      }
    } catch (err) {}
  };

  const fetchLoginHistory = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/users/profile/${identifier}/login-history`);
      if (response.ok) {
        const data = await response.json();
        setLoginHistory(data.loginHistory || []);
      }
    } catch (err) {}
  };

  function getLastNDaysLoginData(loginHistory, n = 35) {
    const today = new Date();
    const days = [];
    const loginSet = new Set(
      (loginHistory || []).map(date => {
        const d = new Date(date);
        return d.getUTCFullYear() + '-' +
          String(d.getUTCMonth() + 1).padStart(2, '0') + '-' +
          String(d.getUTCDate()).padStart(2, '0');
      })
    );
    for (let i = n - 1; i >= 0; i--) {
      const d = new Date();
      d.setUTCDate(d.getUTCDate() - i);
      const dateStr = d.getUTCFullYear() + '-' +
        String(d.getUTCMonth() + 1).padStart(2, '0') + '-' +
        String(d.getUTCDate()).padStart(2, '0');
      days.push({
        date: dateStr,
        loggedIn: loginSet.has(dateStr),
      });
    }
    return days;
  }

  function chunkIntoWeeks(days) {
    const weeks = [];
    let week = [];
    const firstDay = new Date(days[0].date).getDay();
    for (let i = 0; i < firstDay; i++) week.push(null);
    for (const day of days) {
      week.push(day);
      if (week.length === 7) {
        weeks.push(week);
        week = [];
      }
    }
    if (week.length) {
      while (week.length < 7) week.push(null);
      weeks.push(week);
    }
    return weeks;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white p-8 rounded-xl shadow text-center">
          <h2 className="text-2xl font-bold mb-4 text-red-500">{error}</h2>
        </div>
      </div>
    );
  }

  const loginDays = getLastNDaysLoginData(loginHistory, 35);
  const weeks = chunkIntoWeeks(loginDays);
  // Use achievements from achievements API to determine earned badges
  const earnedBadges = achievements.filter(a => a.isEarned).map(a => a.type);
  // For recent achievements, show the most recent earned ones
  const recentAchievements = achievements.filter(a => a.isEarned).sort((a, b) => new Date(b.earnedAt) - new Date(a.earnedAt)).slice(0, 6);
  const currentStreak = profile.currentStreak || 0;
  const longestStreak = profile.longestStreak || 0;
  const totalTasks = profile.totalTasks || 0;
  const completedTasks = profile.completedTasks || 0;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6 mt-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">{profile.displayName}&apos;s Profile</h1>
      </div>

      {/* Profile Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden">
                {profile.avatar ? (
                  <img 
                    src={processAvatarUrl(profile.avatar)} 
                    alt="Profile" 
                    className="w-full h-full object-cover rounded-full"
                    onError={(e) => {
                      // Try fallback URL first
                      const fallbackUrl = createFallbackUrl(profile.avatar);
                      if (fallbackUrl && fallbackUrl !== e.target.src) {
                        e.target.src = fallbackUrl;
                      } else {
                        // Try proxy URL as last resort
                        const proxyUrl = createProxyUrl(profile.avatar);
                        if (proxyUrl && proxyUrl !== e.target.src) {
                          e.target.src = proxyUrl;
                        } else {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }
                      }
                    }}
                    onLoad={(e) => {
                      e.target.nextSibling.style.display = 'none';
                    }}
                  />
                ) : null}
                <div className="w-full h-full bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center" style={{ display: profile.avatar ? 'none' : 'flex' }}>
                  {profile.displayName ? (
                    <span className="text-2xl font-bold text-white">
                      {profile.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </span>
                  ) : (
                    <UserIcon className="w-8 h-8 text-white" />
                  )}
                </div>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center justify-center gap-2">
                {profile.displayName}
                {profile.owner && (
                  <span className="flex items-center gap-1 ml-2">
                    {/* Verified Tick SVG */}
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L9 10.172 7.707 8.879a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    <span className="text-xs font-semibold text-blue-500">Owner</span>
                  </span>
                )}
              </h2>
              <p className="text-gray-600 text-sm">
                @{profile.username || 'lifebuddy_user'}
              </p>
              {profile.ownerEmail && (
                <p className="text-xs text-blue-500 font-semibold mt-1">Owner Email: {profile.ownerEmail}</p>
              )}
              {profile.personalQuote && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-700 italic">"{profile.personalQuote}"</p>
                </div>
              )}
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">{currentStreak}</div>
                  <div className="text-sm text-gray-600">Current Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-500">{longestStreak}</div>
                  <div className="text-sm text-gray-600">Longest Streak</div>
                </div>
              </div>
              <div className="mt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">{completionRate}%</div>
                  <div className="text-sm text-gray-600">Completion Rate</div>
                </div>
              </div>
              {/* Achievement Stats */}
              <div className="mt-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{achievementStats.totalAchievements || 0}</div>
                    <div className="text-sm text-blue-600">Total</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600">{achievementStats.completedAchievements || 0}</div>
                    <div className="text-sm text-green-600">Completed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600">{achievementStats.completionRate || 0}%</div>
                    <div className="text-sm text-purple-600">Completion</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Activity Calendar */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Activity Calendar
            </h3>
            {/* Activity Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600">
                  {totalTasks || 0}
                </div>
                <div className="text-xs sm:text-sm text-blue-600 font-medium">
                  Tasks Completed
                </div>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-4 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-green-600">
                  {loginHistory?.length || 0}
                </div>
                <div className="text-xs sm:text-sm text-green-600 font-medium">
                  Active Days
                </div>
                    </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 text-center">
                <div className="text-2xl sm:text-3xl font-bold text-purple-600">
                  {new Date().getMonth() + 1}
                </div>
                <div className="text-xs sm:text-sm text-purple-600 font-medium">
                  Current Month
                </div>
              </div>
            </div>

            {/* Calendar Header */}
            <div className="mb-4">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">
                {new Date().toLocaleString('default', { month: 'long' })} Activity
              </h4>
            </div>

            {/* Calendar Grid */}
            <div className="bg-gray-50 rounded-lg p-3">
              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="text-center">
                    <div className="text-xs font-medium text-gray-500 py-1">
                      {day}
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1">
                {weeks.map((week, weekIndex) => (
                  week.map((day, dayIndex) => (
                    <div
                      key={`${weekIndex}-${dayIndex}`}
                      className={`
                        w-8 h-8 rounded-sm border border-gray-200 
                        transition-all duration-200 cursor-pointer relative group
                        ${!day ? 'bg-gray-50' : 
                          day.loggedIn ? 'bg-green-500' : 'bg-gray-200'}
                      `}
                      title={day ? `${day.date}: ${day.loggedIn ? 'Checked in' : 'No activity'}` : 'No data'}
                    >
                      {day && (
                        <div className="flex items-center justify-center h-full">
                          <span className="text-xs font-medium text-gray-700">
                            {new Date(day.date).getDate()}
                          </span>
                        </div>
                      )}
                    </div>
                  ))
                ))}
              </div>
            </div>
            
            {/* Activity Legend */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-gray-100 rounded-sm"></div>
                <span className="text-gray-500">No activity</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-200 rounded-sm"></div>
                <span className="text-gray-500">1 login</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-3 bg-green-500 rounded-sm"></div>
                <span className="text-gray-500">Checked in</span>
              </div>
            </div>

            {/* Login Streak Info */}
            {loginHistory && loginHistory.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <h5 className="text-sm font-semibold text-blue-700">
                      Login Streak
                    </h5>
                    <p className="text-xs text-blue-600">
                      {loginHistory.length} days logged in this month
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-blue-600">
                      {loginHistory.length}
                    </div>
                    <div className="text-xs text-blue-600">
                      Days
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      {/* Badges Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrophyIcon className="w-5 h-5" />
          Badges & Achievements ({earnedBadges.length}/{Object.keys(badgeDefinitions).length})
        </h3>
        <div className="max-h-96 overflow-y-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Sort earned badges first */}
            {Object.entries(badgeDefinitions)
              .sort(([aId, a], [bId, b]) => {
                const aEarned = earnedBadges.includes(aId);
                const bEarned = earnedBadges.includes(bId);
                if (aEarned && !bEarned) return -1;
                if (!aEarned && bEarned) return 1;
                return 0;
              })
              .map(([badgeId, badge]) => {
            const isEarned = earnedBadges.includes(badgeId);
            return (
              <div
                key={badgeId}
                className={`p-4 rounded-lg border-2 transition-all duration-300 transform ${
                  isEarned
                    ? 'border-yellow-300 bg-white scale-105'
                    : 'border-gray-100 bg-gray-50 opacity-50'
                }`}
              >
                <div className="text-center">
                  <div
                    className={`w-20 h-20 mx-auto mb-2 rounded-full flex items-center justify-center shadow transition-all duration-300 aspect-square overflow-hidden relative`}
                    style={{ 
                      padding: '8px',
                      boxShadow: isEarned ? `0 0 10px 2px ${badge.color?.includes('bg-gradient') ? '#fff' : badge.color?.replace('bg-', '').replace('-500', '') || '#FFD700'}` : undefined
                    }}
                  >
                    <div className="absolute inset-0 w-full h-full rounded-full bg-black z-0"></div>
                    <img
                      src={badge.image}
                      alt={badge.name}
                      className={`w-full h-full object-contain aspect-square z-10 ${isEarned ? '' : 'grayscale opacity-50'}`}
                      style={{ background: 'transparent' }}
                    />
                  </div>
                  <h4
                    className={`font-medium text-sm ${
                      isEarned ? 'text-gray-900' : 'text-gray-500'
                    }`}
                  >
                    {badge.name}
                  </h4>
                  <p
                    className={`text-xs mt-1 ${
                      isEarned ? 'text-gray-600' : 'text-gray-400'
                    }`}
                  >
                    {badge.description}
                  </p>
                  {isEarned && (
                    <div className="mt-2">
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        Earned
                      </span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          </div>
        </div>
      </div>
      {/* Recent Achievements */}
      {recentAchievements.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <StarIcon className="w-5 h-5" />
            Recent Achievements
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {recentAchievements.map((achievement) => (
                <div key={achievement._id} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                      <TrophyIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {achievement.name}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {achievement.description}
                      </p>
                      {achievement.earnedAt && (
                        <p className="text-xs text-gray-500">
                          Earned {new Date(achievement.earnedAt).toLocaleDateString()}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PublicProfile; 