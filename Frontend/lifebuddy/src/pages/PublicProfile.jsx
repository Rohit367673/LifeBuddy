import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { UserIcon, TrophyIcon } from '@heroicons/react/24/outline';

const PublicProfile = () => {
  const { identifier } = useParams();
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow text-center">
          <p className="text-lg text-red-500 font-semibold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 mt-8 max-w-xl mx-auto">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 text-center">
        <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <UserIcon className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{profile.displayName}</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm">@{profile.username}</p>
        {profile.personalQuote && (
          <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-gray-700 dark:text-gray-300 italic">"{profile.personalQuote}"</p>
          </div>
        )}
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
            <div className="text-2xl font-bold text-green-500">{profile.completedTasks}/{profile.totalTasks}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Tasks Completed</div>
          </div>
        </div>
      </div>
      {/* Badges Section */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2 justify-center">
          <TrophyIcon className="w-5 h-5" />
          Badges & Achievements
        </h3>
        {profile.badges && profile.badges.length > 0 ? (
          <div className="flex flex-wrap gap-2 justify-center">
            {profile.badges.map((badge, idx) => (
              <span key={idx} className="inline-block px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-semibold">
                {badge}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm text-center">No badges yet.</p>
        )}
      </div>
    </div>
  );
};

export default PublicProfile; 