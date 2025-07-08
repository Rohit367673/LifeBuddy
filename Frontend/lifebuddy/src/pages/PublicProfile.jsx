import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { UserIcon } from '@heroicons/react/24/outline';

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
    return <div className="flex items-center justify-center min-h-screen"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div></div>;
  }
  if (error) {
    return <div className="flex items-center justify-center min-h-screen"><div className="text-red-500 text-lg font-semibold">{error}</div></div>;
  }
  return (
    <div className="max-w-xl mx-auto mt-10 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
      <div className="flex flex-col items-center">
        <div className="w-24 h-24 mb-4 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
          <UserIcon className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{profile.displayName}</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">@{profile.username}</p>
        {profile.personalQuote && (
          <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <p className="text-gray-700 dark:text-gray-300 italic">"{profile.personalQuote}"</p>
          </div>
        )}
        <div className="mt-4 grid grid-cols-2 gap-4 w-full">
          <div className="text-center">
            <div className="text-xl font-bold text-blue-500">{profile.currentStreak}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Current Streak</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-purple-500">{profile.longestStreak}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Longest Streak</div>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-4 w-full">
          <div className="text-center">
            <div className="text-xl font-bold text-green-500">{profile.completedTasks}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Tasks Done</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-yellow-500">{profile.totalTasks}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Tasks</div>
          </div>
        </div>
        <div className="mt-6 text-xs text-gray-400">Joined: {new Date(profile.joinedAt).toLocaleDateString()}</div>
      </div>
    </div>
  );
};

export default PublicProfile; 