import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { UserIcon, TrophyIcon, CalendarIcon, StarIcon } from '@heroicons/react/24/outline';
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/users/profile/${identifier}`);
        if (response.ok) {
          const data = await response.json();
          setProfile(data);
        } else if (response.status === 403) {
          setError('This profile is private.');
        } else if (response.status === 404) {
          setError('Profile not found.');
        } else {
          setError('Failed to load profile.');
        }
      } catch (err) {
        setError('Network error.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [identifier]);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div></div>;
  }
  if (error) {
    return <div className="flex items-center justify-center min-h-screen"><div className="text-red-500 text-lg font-semibold">{error}</div></div>;
  }

  // Badges
  const earnedBadges = (profile.badges || []).filter(Boolean);

  return (
    <div className="space-y-6 mt-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{profile.displayName}&apos;s Profile</h1>
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
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <UserIcon className="w-12 h-12 text-white" />
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center justify-center gap-2">
                {profile.displayName}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                @{profile.username}
              </p>
              {profile.personalQuote && (
                <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <p className="text-gray-700 dark:text-gray-300 italic">"{profile.personalQuote}"</p>
                </div>
              )}
              {/* Stats */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-500">{profile.currentStreak}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Current Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-500">{profile.longestStreak}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Longest Streak</div>
                </div>
              </div>
              <div className="mt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-500">{profile.completedTasks}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Tasks Done</div>
                </div>
              </div>
              <div className="mt-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-500">{profile.totalTasks}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Total Tasks</div>
                </div>
              </div>
              <div className="mt-6 text-xs text-gray-400">Joined: {new Date(profile.joinedAt).toLocaleDateString()}</div>
            </div>
          </div>
        </div>

        {/* Badges Section */}
        <div className="lg:col-span-2">
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
        </div>
      </div>

      {/* Recent Achievements (if available) */}
      {/* You can add more sections here if you want to show more public info */}
    </div>
  );
};

export default PublicProfile; 