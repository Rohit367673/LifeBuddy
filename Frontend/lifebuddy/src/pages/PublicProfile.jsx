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
                  <img src={profile.avatar} alt="Profile" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <img src="/default-profile.png" alt="Default Profile" className="w-full h-full object-cover rounded-full" />
                )}
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
            <div className="mt-6">
              <div className="font-semibold mb-2 text-sm text-gray-700">Activity Calendar</div>
              <div className="overflow-x-auto">
                <div className="flex gap-1">
                  {weeks.map((week, wi) => (
                    <div key={wi} className="flex flex-col gap-1">
                      {week.map((day, di) => (
                        <div
                          key={di}
                          className={`w-4 h-4 rounded-sm border border-gray-200 transition-colors duration-200
                            ${!day ? 'bg-transparent' :
                              day.loggedIn ? 'bg-green-500' :
                              'bg-gray-200'}
                          `}
                          title={day ? `${day.date}: ${day.loggedIn ? 'Checked in' : ''}` : ''}
                          style={{ minWidth: 16, minHeight: 16 }}
                        />
                      ))}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-1 text-xs text-gray-400">
                  <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* Badges Section */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <TrophyIcon className="w-5 h-5" />
          Badges & Achievements ({earnedBadges.length}/{Object.keys(badgeDefinitions).length})
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(badgeDefinitions).map(([badgeId, badge]) => {
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