import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  UserIcon, 
  ShareIcon, 
  CogIcon, 
  TrophyIcon, 
  CalendarIcon, 
  ChartBarIcon,
  StarIcon,
  FireIcon,
  HeartIcon,
  AcademicCapIcon,
  LightBulbIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import badge2 from '../assets/svg/badge-2.svg';
import badge3 from '../assets/svg/badge-3.svg';
import badge4 from '../assets/svg/badge-4.svg';
import badge5 from '../assets/svg/badge-5.svg';
import badge6 from '../assets/svg/badge-6.svg';
import badge7 from '../assets/svg/badge-7.svg';
import badge8 from '../assets/svg/badge-8.svg';
import badge9 from '../assets/svg/badge-9.svg';
import badge10 from '../assets/svg/badge-10.svg';

const Profile = () => {
  const { user, getFirebaseToken, firebaseUser } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [profileVisibility, setProfileVisibility] = useState('public');
  const [personalQuote, setPersonalQuote] = useState('');
  const [achievementStats, setAchievementStats] = useState({});
  const [productivityData, setProductivityData] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);

  // Badge definitions with images
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
    'streak_7': {
      name: 'Week Warrior',
      description: '7-day consistency streak',
      image: badge3,
      color: 'bg-orange-500',
      textColor: 'text-orange-500'
    },
    'streak_30': {
      name: 'Monthly Master',
      description: '30-day consistency streak',
      image: badge7,
      color: 'bg-purple-500',
      textColor: 'text-purple-500'
    },
    'mood_tracker': {
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

    'motivation_master': {
      name: 'Motivation Master',
      description: 'Read 50 motivational messages',
      image: badge8,
      color: 'bg-indigo-500',
      textColor: 'text-indigo-500'
    },
    'consistency_king': {
      name: 'Consistency King',
      description: '100-day streak',
      image: badge9,
      color: 'bg-gradient-to-r from-purple-500 to-pink-500',
      textColor: 'text-purple-500'
    },
        'achievement_hunter': {
      name: 'R7 Spirit',
      description: 'Unlocked 10 achievements',
      image: badge4,
      color: 'bg-green-500',
      textColor: 'text-green-500'
    },
  };

  useEffect(() => {
    loadProfileData();
    loadAchievements();
    loadProductivityData();
    loadLoginHistory();
  }, []);

  // Show toast if a new badge is earned after login
  useEffect(() => {
    if (achievements.length > 0) {
      const justEarned = achievements.find(a => a.type === 'first_login' && a.isEarned);
      if (justEarned && !window._firstLoginBadgeToastShown) {
        toast.success('🎉 You earned the Welcome Aboard! badge for your first login!');
        window._firstLoginBadgeToastShown = true;
      }
    }
  }, [achievements]);

  const loadProfileData = async () => {
    try {
      const token = await getFirebaseToken();
      console.log('Token for profile request:', token ? 'Present' : 'Missing');
      
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/users/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('Profile response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
        setPersonalQuote(data.personalQuote || '');
        setProfileVisibility(data.profileVisibility || 'public');
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Profile response error:', errorData);
        toast.error(`Failed to load profile data: ${errorData.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
      toast.error(`Failed to load profile data: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAchievements = async () => {
    try {
      const [achievementsResponse, statsResponse] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/achievements`, {
          headers: {
            'Authorization': `Bearer ${await getFirebaseToken()}`
          }
        }),
        fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/achievements/stats/overview`, {
          headers: {
            'Authorization': `Bearer ${await getFirebaseToken()}`
          }
        })
      ]);

      if (achievementsResponse.ok) {
        const achievementsData = await achievementsResponse.json();
        setAchievements(achievementsData);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setAchievementStats(statsData);
      }
    } catch (error) {
      console.error('Error loading achievements:', error);
    }
  };

  const loadProductivityData = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/users/stats?period=30`, {
        headers: {
          'Authorization': `Bearer ${await getFirebaseToken()}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setProductivityData(data.productivityData || []);
      }
    } catch (error) {
      console.error('Error loading productivity data:', error);
    }
  };

  const loadLoginHistory = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/users/profile/login-history`, {
        headers: {
          'Authorization': `Bearer ${await getFirebaseToken()}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setLoginHistory(data.loginHistory || []);
      }
    } catch (error) {
      console.error('Error loading login history:', error);
    }
  };

  const checkAndAwardAchievements = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/achievements/check`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getFirebaseToken()}`
        },
        body: JSON.stringify({
          userStats: {
            eventsCreated: profileData?.totalEvents || 0,
            eventsCompleted: profileData?.completedEvents || 0,
            tasksCompleted: profileData?.completedTasks || 0,
            moodEntries: profileData?.moodEntries || 0,
            currentStreak: profileData?.currentStreak || 0
          }
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (data.newAchievements && data.newAchievements.length > 0) {
          toast.success(`🎉 Unlocked ${data.newAchievements.length} new achievement(s)!`);
          await loadAchievements(); // Reload achievements
        }
      }
    } catch (error) {
      console.error('Error checking achievements:', error);
    }
  };

  const updateProfileSettings = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${await getFirebaseToken()}`
        },
        body: JSON.stringify({
          personalQuote,
          profileVisibility
        })
      });

      if (response.ok) {
        toast.success('Profile settings updated successfully');
        await loadProfileData();
      }
    } catch (error) {
      console.error('Error updating profile settings:', error);
      toast.error('Failed to update profile settings');
    }
  };

  const copyProfileLink = () => {
    const profileUrl = `${window.location.origin}/profile/${user?.username || user?.firebaseUid}`;
    navigator.clipboard.writeText(profileUrl);
    toast.success('Profile link copied to clipboard!');
    setShowShareModal(false);
  };

  const getActivityColor = (count) => {
    if (count === 0) return 'bg-gray-200 dark:bg-gray-700';
    if (count < 2) return 'bg-green-100 dark:bg-green-900';
    if (count < 4) return 'bg-green-300 dark:bg-green-700';
    if (count < 7) return 'bg-green-500 dark:bg-green-500';
    return 'bg-green-700 dark:bg-green-400';
  };

  // Get earned badges from achievements
  const getEarnedBadges = () => {
    return achievements
      .filter(achievement => achievement.isEarned)
      .map(achievement => achievement.type);
  };

  // Utility to get last N days as [{date, loggedIn}] sorted oldest to newest
  function getLastNDaysLoginData(loginHistory, n = 35) {
    const today = new Date();
    const days = [];
    // Use UTC date string for comparison
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

  // Utility to chunk into weeks (columns)
  function chunkIntoWeeks(days) {
    const weeks = [];
    let week = [];
    // Pad start if first day is not Sunday
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

  const loginDays = getLastNDaysLoginData(loginHistory, 35); // 5 weeks
  const weeks = chunkIntoWeeks(loginDays);
  const earnedBadges = getEarnedBadges();
  const currentStreak = profileData?.currentStreak || 0;
  const longestStreak = profileData?.longestStreak || 0;
  const totalTasks = profileData?.totalTasks || 0;
  const completedTasks = profileData?.completedTasks || 0;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="space-y-6 mt-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">My Profile</h1>
        <div className="flex gap-2">
          <button
            onClick={checkAndAwardAchievements}
            className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
          >
            <TrophyIcon className="w-5 h-5" />
            Check Achievements
          </button>
          <button
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <ShareIcon className="w-5 h-5" />
            Share Profile
          </button>
        </div>
      </div>

      {/* Profile Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center overflow-hidden">
                {user?.avatar || firebaseUser?.photoURL ? (
                  <img src={user?.avatar || firebaseUser?.photoURL} alt="Profile" className="w-full h-full object-cover rounded-full" />
                ) : (
                  <img src="/default-profile.png" alt="Default Profile" className="w-full h-full object-cover rounded-full" />
                )}
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center justify-center gap-2">
                {user?.displayName || user?.email}
                {user?.email === 'rohit367673@gmail.com' && (user?.username === 'rohit' || user?.displayName?.toLowerCase() === 'rohit') && (
                  <span className="flex items-center gap-1 ml-2">
                    {/* Verified Tick SVG */}
                    <svg className="w-5 h-5 text-blue-500" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.707a1 1 0 00-1.414-1.414L9 10.172 7.707 8.879a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                    <span className="text-xs font-semibold text-blue-500">Owner</span>
                  </span>
                )}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                @{user?.username || 'lifebuddy_user'}
              </p>
              {user?.email === 'rohit367673@gmail.com' && (
                <p className="text-xs text-blue-500 font-semibold mt-1">Owner Email: {user.email}</p>
              )}
              
              {personalQuote && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-gray-700 dark:text-gray-300 italic">"{personalQuote}"</p>
                </div>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">{currentStreak}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Current Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-500">{longestStreak}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Longest Streak</div>
                </div>
              </div>

              <div className="mt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">{completionRate}%</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</div>
                </div>
              </div>

              {/* Achievement Stats */}
              <div className="mt-4 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg">
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div>
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{achievementStats.totalAchievements || 0}</div>
                    <div className="text-sm text-blue-600 dark:text-blue-400">Total</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-green-600 dark:text-green-400">{achievementStats.completedAchievements || 0}</div>
                    <div className="text-sm text-green-600 dark:text-green-400">Completed</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{achievementStats.completionRate || 0}%</div>
                    <div className="text-sm text-purple-600 dark:text-purple-400">Completion</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Activity Calendar (LeetCode style) */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <CalendarIcon className="w-5 h-5" />
              Activity Calendar
            </h3>
            <div className="mt-6">
              <div className="font-semibold mb-2 text-sm text-gray-700 dark:text-gray-200">Activity Calendar</div>
              <div className="overflow-x-auto">
                <div className="flex gap-1">
                  {/* Week columns */}
                  {weeks.map((week, wi) => (
                    <div key={wi} className="flex flex-col gap-1">
                      {week.map((day, di) => (
                        <div
                          key={di}
                          className={`w-4 h-4 rounded-sm border border-gray-200 dark:border-gray-700 transition-colors duration-200
                            ${!day ? 'bg-transparent' :
                              day.loggedIn ? 'bg-green-500' :
                              'bg-gray-200 dark:bg-gray-800'}
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
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
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
            ? 'border-yellow-300 bg-white dark:bg-gray-700 scale-105'
            : 'border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 opacity-50'
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
            {/* Black circle background always */}
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
              isEarned ? 'text-gray-900 dark:text-white' : 'text-gray-500'
            }`}
          >
            {badge.name}
          </h4>
          <p
            className={`text-xs mt-1 ${
              isEarned ? 'text-gray-600 dark:text-gray-400' : 'text-gray-400'
            }`}
          >
            {badge.description}
          </p>
          {isEarned && (
            <div className="mt-2">
              <span className="text-xs bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 px-2 py-1 rounded-full">
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
      {achievements.filter(a => a.isEarned).length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <StarIcon className="w-5 h-5" />
            Recent Achievements
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements
              .filter(a => a.isEarned)
              .slice(0, 6)
              .map((achievement) => (
                <div key={achievement._id} className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-yellow-500 rounded-full flex items-center justify-center">
                      <TrophyIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {achievement.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
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

      {/* Profile Settings */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <CogIcon className="w-5 h-5" />
          Profile Settings
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Personal Quote/Motto
            </label>
            <textarea
              value={personalQuote}
              onChange={(e) => setPersonalQuote(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
              placeholder="Share your personal motto or favorite quote..."
              rows={3}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Profile Visibility
            </label>
            <select
              value={profileVisibility}
              onChange={(e) => setProfileVisibility(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
            >
              <option value="public">Public - Anyone can view</option>
              <option value="friends">Friends Only - Only friends can view</option>
              <option value="private">Private - Only you can view</option>
            </select>
          </div>
          
          <button
            onClick={updateProfileSettings}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Save Settings
          </button>
        </div>
      </div>

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Share Your Profile
            </h3>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your Profile URL
              </label>
              <div className="flex">
                <input
                  type="text"
                  value={`${window.location.origin}/profile/${user?.username || user?.firebaseUid}`}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-l-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <button
                  onClick={copyProfileLink}
                  className="px-4 py-2 bg-blue-500 text-white rounded-r-lg hover:bg-blue-600 transition-colors"
                >
                  Copy
                </button>
              </div>
            </div>
            
            <div className="flex gap-2">
              <button
                onClick={() => setShowShareModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile; 