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

const PublicProfile = () => {
  const { identifier } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [achievements, setAchievements] = useState([]);
  const [loginHistory, setLoginHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    document.body.classList.remove('dark'); // Force light mode
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        // Fetch public profile data
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/users/profile/${identifier}`);
        if (!response.ok) {
          if (response.status === 403) setError('This profile is private.');
          else if (response.status === 404) setError('Profile not found.');
          else setError('Failed to load profile.');
          setLoading(false);
          return;
        }
        const data = await response.json();
        setProfile(data);
        // Fetch achievements (for recent achievements section)
        const achRes = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/achievements?user=${identifier}`);
        if (achRes.ok) {
          const achData = await achRes.json();
          setAchievements(achData);
        }
        // Fetch login history for activity calendar
        // (If you want to show this, you need a public endpoint or add it to the public profile API)
        setLoading(false);
      } catch (err) {
        setError('Network error.');
        setLoading(false);
      }
    };
    fetchProfile();
    // eslint-disable-next-line
  }, [identifier]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen bg-white"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div></div>;
  }
  if (error) {
    return <div className="flex items-center justify-center min-h-screen bg-white"><div className="text-red-500 text-lg font-semibold">{error}</div></div>;
  }

  // Badges
  const earnedBadges = (profile.badges || []).filter(Boolean);

  return (
    <div className="space-y-6 mt-8 bg-white">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">{profile.displayName}&apos;s Profile</h1>
        <button
          onClick={() => navigate('/')}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Go to Home
        </button>
      </div>

      {/* Profile Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <UserIcon className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 flex items-center justify-center gap-2">
                {profile.displayName}
              </h2>
              <p className="text-gray-600 text-sm">
                @{profile.username}
              </p>
              {profile.personalQuote && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-gray-700 italic">"{profile.personalQuote}"</p>
                </div>
              )}
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">{profile.currentStreak}</div>
                  <div className="text-sm text-gray-600">Current Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-500">{profile.longestStreak}</div>
                  <div className="text-sm text-gray-600">Longest Streak</div>
                </div>
              </div>
              <div className="mt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">{profile.completedTasks}</div>
                  <div className="text-sm text-gray-600">Tasks Done</div>
                </div>
              </div>
              <div className="mt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-500">{profile.totalTasks}</div>
                  <div className="text-sm text-gray-600">Total Tasks</div>
                </div>
              </div>
              <div className="mt-6 text-xs text-gray-400">Joined: {new Date(profile.joinedAt).toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        {/* Badges Section */}
        <div className="lg:col-span-2">
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
                          boxShadow: isEarned
                            ? `0 0 10px 2px ${badge.color?.includes('bg-gradient') ? '#fff' : badge.color?.replace('bg-', '').replace('-500', '') || '#FFD700'}`
                            : undefined
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
      </div>

      {/* Recent Achievements (if available) */}
      {achievements.filter(a => a.isEarned).length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <StarIcon className="w-5 h-5" />
            Recent Achievements
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements
              .filter(a => a.isEarned)
              .slice(0, 6)
              .map((achievement) => (
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