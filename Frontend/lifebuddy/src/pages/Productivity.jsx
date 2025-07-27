import { CheckCircleIcon, CalendarIcon, ChartBarIcon, BellIcon, SparklesIcon, ShieldCheckIcon, CpuChipIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { usePremium } from '../context/PremiumContext';
import { Link, useNavigate } from 'react-router-dom';
import PremiumCalendar from './PremiumCalendar';
import { useEffect } from 'react';

export default function Productivity() {
  const { user } = useAuth();
  const { subscription, loading: premiumLoading } = usePremium();
  const isAdmin = user && user.email === 'rohit367673@gmail.com';
  const isPremium = subscription && subscription.plan && subscription.plan !== 'free';
  const navigate = useNavigate();

  useEffect(() => {
    // If user is premium/admin, check for ongoing schedule and redirect if present
    if ((isAdmin || isPremium) && !premiumLoading) {
      fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/premium-tasks/today`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.taskId) {
            navigate('/my-schedule');
          }
        });
    }
    // eslint-disable-next-line
  }, [isAdmin, isPremium, premiumLoading]);

  if ((isAdmin || isPremium) && !premiumLoading) {
    // Show the actual DeepSeek scheduling feature for admin/premium
    return <PremiumCalendar />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 via-purple-100 to-pink-100 flex items-center justify-center py-6 sm:py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="backdrop-blur-xl bg-white/70 border border-purple-200 rounded-2xl sm:rounded-3xl shadow-2xl p-6 sm:p-8 lg:p-10 max-w-3xl w-full mx-auto relative overflow-hidden">
        {/* Decorative gradient blob */}
        <div className="absolute -top-20 -right-20 w-48 h-48 sm:w-72 sm:h-72 bg-gradient-to-br from-purple-400 via-pink-300 to-yellow-200 rounded-full opacity-30 blur-2xl z-0 animate-pulse" />
        <div className="relative z-10">
          <div className="flex justify-center mb-4 sm:mb-6">
            <span className="inline-block bg-gradient-to-r from-purple-500 to-pink-400 rounded-full p-3 sm:p-4 animate-bounce shadow-lg">
              <SparklesIcon className="h-8 w-8 sm:h-10 sm:w-10 text-white" />
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 via-pink-600 to-yellow-500 mb-3 sm:mb-4 tracking-tight drop-shadow-lg text-center">Productivity System</h1>
          <p className="mb-6 sm:mb-8 text-gray-800 text-base sm:text-lg lg:text-xl max-w-xl mx-auto font-medium text-center">Supercharge your planning, stay motivated, and achieve more with LifeBuddy Premium's Productivity System.</p>

          {/* AI-powered section */}
          <div className="bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 mb-6 sm:mb-8 flex flex-col sm:flex-row items-center gap-3 sm:gap-4 shadow-md border border-purple-100 animate-fade-in">
            <div className="bg-gradient-to-br from-purple-500 to-pink-400 rounded-full p-2 sm:p-3 flex items-center justify-center">
              <CpuChipIcon className="h-6 w-6 sm:h-8 sm:w-8 text-white animate-spin-slow" />
            </div>
            <div className="text-center sm:text-left">
              <h2 className="text-xl sm:text-2xl font-bold text-purple-700 mb-1">AI-Powered Productivity</h2>
              <p className="text-sm sm:text-base text-gray-700">Get smart daily schedules, personalized reminders, and motivational boosts—automatically tailored to your goals and habits.</p>
            </div>
          </div>

          <ul className="text-left mb-6 sm:mb-8 text-gray-900 space-y-3 sm:space-y-4 max-w-md mx-auto">
            <li className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg"><CheckCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-green-500 flex-shrink-0" /> <span>Smart daily scheduling</span></li>
            <li className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg"><BellIcon className="h-5 w-5 sm:h-6 sm:w-6 text-blue-500 flex-shrink-0" /> <span>Personalized reminders</span></li>
            <li className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg"><SparklesIcon className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-500 flex-shrink-0" /> <span>Motivation & streak rewards</span></li>
            <li className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg"><CalendarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-purple-500 flex-shrink-0" /> <span>Full calendar & event analytics</span></li>
            <li className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg"><ChartBarIcon className="h-5 w-5 sm:h-6 sm:w-6 text-pink-500 flex-shrink-0" /> <span>Progress & trend tracking</span></li>
            <li className="flex items-center gap-2 sm:gap-3 text-base sm:text-lg"><ShieldCheckIcon className="h-5 w-5 sm:h-6 sm:w-6 text-indigo-500 flex-shrink-0" /> <span>Priority support</span></li>
          </ul>
          {!(isAdmin || isPremium) && !premiumLoading && (
            <div className="flex justify-center">
              <a href="/premium" className="inline-block px-6 sm:px-10 py-3 sm:py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-400 text-white font-extrabold rounded-xl sm:rounded-2xl shadow-xl hover:from-purple-600 hover:to-yellow-500 transition-all text-lg sm:text-xl lg:text-2xl tracking-wide animate-bounce-once text-center">
                Upgrade for Full Access
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 