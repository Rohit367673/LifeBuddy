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
  SparklesIcon,
  MagnifyingGlassIcon
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
  const [usernameInput, setUsernameInput] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [isSettingUsername, setIsSettingUsername] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [friends, setFriends] = useState([]);
  const [calendarStatus, setCalendarStatus] = useState([]);
  const [friendMessage, setFriendMessage] = useState('');

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
    // Only fetch profile data when token is available
    getFirebaseToken().then(token => {
      if (token) loadProfileData();
    });
    loadAchievements();
    loadProductivityData();
    loadLoginHistory();
    loadCalendarStatus();

    // Listen for calendar status update events (from PremiumCalendar)
    const reloadCalendar = () => loadCalendarStatus();
    window.addEventListener('calendarStatusUpdated', reloadCalendar);
    return () => window.removeEventListener('calendarStatusUpdated', reloadCalendar);
  }, [user, firebaseUser]);

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
    const token = await getFirebaseToken();
    if (!token) {
      toast.error('Not authenticated');
      return;
    }
    try {
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

  const loadCalendarStatus = async () => {
    try {
      const token = await getFirebaseToken();
      if (!token) return;
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/premium-tasks/calendar-status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setCalendarStatus(data.days || []);
      }
    } catch (error) {
      console.error('Error loading calendar status:', error);
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
      const token = await getFirebaseToken();
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          personalQuote,
          profileVisibility,
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

  // Utility to get last N days from calendarStatus
  function getLastNDaysCalendarStatus(n = 35) {
    if (!calendarStatus || calendarStatus.length === 0) return [];
    return calendarStatus.slice(-n);
  }

  // Username prompt logic
  const handleSetUsername = async (e) => {
    e.preventDefault();
    setUsernameError('');
    setIsSettingUsername(true);
    setFriendMessage('');
    try {
      const token = await getFirebaseToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/users/set-username`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ username: usernameInput })
      });
      const data = await res.json();
      if (!res.ok) {
        setUsernameError(data.message || 'Failed to set username');
      } else {
        toast.success('Username set successfully!');
        setUsernameInput('');
        setUsernameError('');
        await loadProfileData();
      }
    } catch (err) {
      setUsernameError('Failed to set username');
    } finally {
      setIsSettingUsername(false);
    }
  };

  // User ID search logic (exact match)
  const handleSearch = async (e) => {
    e.preventDefault();
    setSearchLoading(true);
    setSearchResult(null);
    setSearchError('');
    try {
      let q = searchQuery.trim();
      if (q.startsWith('@')) q = q.slice(1);
      if (!q) {
        setSearchError('Please enter a user ID');
        setSearchLoading(false);
        return;
      }
      const token = await getFirebaseToken();
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/users/search?q=${encodeURIComponent(q)}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        // Find exact match (case-insensitive)
        const found = data.find(u => u.username && u.username.toLowerCase() === q.toLowerCase());
        if (found) {
          if (found._id === user._id) {
            setSearchError('That is your own user ID!');
          } else {
            setSearchResult(found);
          }
        } else {
          setSearchError('No user found with that ID');
        }
      } else {
        setSearchError(data.message || 'Search failed');
      }
    } catch (err) {
      setSearchError('Search failed');
    } finally {
      setSearchLoading(false);
    }
  };

  // Fetch friends list on mount
  useEffect(() => {
    const fetchFriends = async () => {
      try {
        const token = await getFirebaseToken();
        const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/users/friends`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setFriends(data);
        }
      } catch (err) {
        // Ignore errors for now
      }
    };
    fetchFriends();
    // eslint-disable-next-line
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Defensive: declare 'today' only once before any calendar logic
  const today = new Date();
  const loginDays = getLastNDaysLoginData(loginHistory, 35); // 5 weeks
  const weeks = chunkIntoWeeks(loginDays);
  const earnedBadges = getEarnedBadges();
  const currentStreak = profileData?.currentStreak || 0;
  const longestStreak = profileData?.longestStreak || 0;
  const totalTasks = profileData?.totalTasks || 0;
  const completedTasks = profileData?.completedTasks || 0;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Defensive: if profileData is not loaded, show a fallback UI
  if (!profileData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Simple Monthly Activity Calendar
  const generateMonthlyCalendar = () => {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth();
    const currentYear = currentDate.getFullYear();
    
    // Get first day of current month
    const firstDay = new Date(currentYear, currentMonth, 1);
    const lastDay = new Date(currentYear, currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Build activity map
    const activityMap = {};
    if (profileData.completedTaskDatesDetailed) {
      profileData.completedTaskDatesDetailed.forEach(entry => {
        const dateStr = new Date(entry.date).toISOString().slice(0, 10);
        activityMap[dateStr] = entry.completedCount || 1;
      });
    }
    if (profileData.completedTaskDates) {
      profileData.completedTaskDates.forEach(dateStr => {
        if (!activityMap[dateStr]) {
          activityMap[dateStr] = 1;
        } else {
          activityMap[dateStr]++;
        }
      });
    }
    
    // Generate calendar days
    const calendarDays = [];
    const startDay = firstDay.getDay(); // 0 = Sunday
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startDay; i++) {
      calendarDays.push(null);
    }
    
    // Add days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(currentYear, currentMonth, day);
      const dateStr = date.toISOString().slice(0, 10);
      
      calendarDays.push({
        date: dateStr,
        day: day,
        completedCount: activityMap[dateStr] || 0,
        isToday: day === currentDate.getDate(),
        isPast: date <= currentDate
      });
    }
    
    // Group into weeks
    const calendarWeeks = [];
    for (let i = 0; i < calendarDays.length; i += 7) {
      calendarWeeks.push(calendarDays.slice(i, i + 7));
    }
    
    return { calendarWeeks, activityMap };
  };
  
  const { calendarWeeks, activityMap } = generateMonthlyCalendar();
  
  // Calculate monthly stats
  const totalSubmissions = Object.values(activityMap).reduce((sum, count) => sum + count, 0);
  const totalActiveDays = Object.values(activityMap).filter(count => count > 0).length;
  const currentMonth = new Date().toLocaleString('default', { month: 'long', year: 'numeric' });
  
  // Simple color function for monthly calendar
  const getMonthlyActivityColor = (day) => {
    if (!day) return 'bg-gray-50 dark:bg-gray-900';
    if (day.completedCount === 0) return 'bg-gray-100 dark:bg-gray-800';
    if (day.completedCount === 1) return 'bg-green-200 dark:bg-green-800';
    if (day.completedCount === 2) return 'bg-green-400 dark:bg-green-600';
    if (day.completedCount >= 3) return 'bg-green-600 dark:bg-green-400';
    return 'bg-gray-100 dark:bg-gray-800';
  };

  return (
    <div className="space-y-6 mt-8">
      {/* Username Prompt */}
      {!user?.username && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex flex-col items-center mb-4">
          <h2 className="text-lg font-semibold mb-2">Choose your unique LifeBuddy ID</h2>
          <form onSubmit={handleSetUsername} className="flex flex-col sm:flex-row gap-2 items-center w-full max-w-md">
            <input
              type="text"
              value={usernameInput}
              onChange={e => setUsernameInput(e.target.value)}
              placeholder="Enter a unique username (3-30 chars)"
              className="border rounded px-3 py-2 w-full"
              minLength={3}
              maxLength={30}
              pattern="[a-zA-Z0-9_]+"
              required
              disabled={isSettingUsername}
            />
            <button
              type="submit"
              className="btn-primary px-4 py-2"
              disabled={isSettingUsername}
            >
              {isSettingUsername ? 'Saving...' : 'Set Username'}
            </button>
          </form>
          {usernameError && <div className="text-red-500 mt-2">{usernameError}</div>}
        </div>
      )}
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
                  <img src={user?.avatar || firebaseUser?.photoURL || '/default-profile.png'} alt="Profile" className="w-full h-full object-cover rounded-full" />
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
          {/* User ID Search Bar */}
          <div className="mt-8 bg-gray-50 dark:bg-gray-900 rounded-xl shadow p-4">
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2"><MagnifyingGlassIcon className="w-5 h-5" /> Search User by ID</h3>
            <form onSubmit={handleSearch} className="flex gap-2 mb-2">
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search by user ID (e.g. @username)"
                className="border rounded px-3 py-2 w-full"
                minLength={2}
                required
                disabled={searchLoading}
              />
              <button type="submit" className="btn-secondary px-4 py-2" disabled={searchLoading}>
                {searchLoading ? 'Searching...' : 'Search'}
              </button>
            </form>
            {searchError && <div className="text-danger-600 mb-2">{searchError}</div>}
            {searchResult && (
              <div className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-lg p-4 shadow mt-2">
                <img src={searchResult.avatar || '/default-profile.png'} alt="avatar" className="w-10 h-10 rounded-full object-cover" />
                <div className="flex-1">
                  <div className="font-semibold">@{searchResult.username}</div>
                  <div className="text-gray-500">{searchResult.displayName}</div>
                </div>
                <a
                  href={`/profile/${searchResult.username}`}
                  className="btn-primary px-3 py-1 text-sm"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  View Profile
                </a>
              </div>
            )}
            {/* Friends List */}
            {friends.length > 0 && (
              <div className="mt-6">
                <h4 className="font-semibold mb-2">Your Friends</h4>
                <ul className="divide-y divide-gray-200 dark:divide-gray-700">
                  {friends.map(friend => (
                    <li key={friend._id} className="flex items-center gap-3 py-2">
                      <img src={friend.avatar || '/default-profile.png'} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                      <span className="font-medium">@{friend.username}</span>
                      <span className="text-gray-500">{friend.displayName}</span>
                      <a
                        href={`/profile/${friend.username}`}
                        className="btn-secondary px-2 py-1 text-xs ml-auto"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        View
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
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
              <div className="font-semibold mb-4 text-lg text-gray-800 dark:text-gray-100">
                {currentMonth} Activity
              </div>
              
              {/* Monthly Calendar */}
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center text-xs font-semibold text-gray-500 dark:text-gray-400 py-1">
                      {day}
                    </div>
                  ))}
                </div>
                
                {/* Calendar grid */}
                <div className="grid grid-cols-7 gap-1">
                  {calendarWeeks.map((week, weekIndex) => (
                    week.map((day, dayIndex) => (
                      <div
                        key={`${weekIndex}-${dayIndex}`}
                                                  className={`
                            aspect-square rounded-lg border border-gray-200 dark:border-gray-700 
                            transition-all duration-200 cursor-pointer relative
                            ${getMonthlyActivityColor(day)}
                            ${day?.isToday ? 'ring-2 ring-blue-500 ring-offset-2' : ''}
                            ${!day ? 'bg-gray-50 dark:bg-gray-900' : ''}
                          `}
                        title={day ? `${day.date}: ${day.completedCount} task${day.completedCount === 1 ? '' : 's'} completed` : 'No activity'}
                      >
                        {day && (
                          <div className="flex flex-col items-center justify-center h-full">
                            <span className={`text-xs font-medium ${
                              day.isToday ? 'text-blue-600 dark:text-blue-400 font-bold' : 
                              day.isPast ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400'
                            }`}>
                              {day.day}
                            </span>
                            {day.completedCount > 0 && (
                              <span className="text-xs text-green-600 dark:text-green-400 font-bold">
                                {day.completedCount}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    ))
                  ))}
                </div>
                
                {/* Legend */}
                <div className="flex items-center justify-center gap-4 mt-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-gray-100 dark:bg-gray-800 rounded"></div>
                    <span>No activity</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-200 dark:bg-green-800 rounded"></div>
                    <span>1 task</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-400 dark:bg-green-600 rounded"></div>
                    <span>2 tasks</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-600 dark:bg-green-400 rounded"></div>
                    <span>3+ tasks</span>
                  </div>
                </div>
              </div>
              
              {/* Monthly Stats */}
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-green-600 dark:text-green-400">{totalSubmissions}</div>
                  <div className="text-sm text-green-600 dark:text-green-400">Tasks Completed</div>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{totalActiveDays}</div>
                  <div className="text-sm text-blue-600 dark:text-blue-400">Active Days</div>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                    {totalActiveDays > 0 ? Math.round((totalActiveDays / new Date().getDate()) * 100) : 0}%
                  </div>
                  <div className="text-sm text-purple-600 dark:text-purple-400">Monthly Progress</div>
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