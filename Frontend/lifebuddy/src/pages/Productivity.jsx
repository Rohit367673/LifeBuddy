import { CheckCircleIcon, CalendarIcon, ChartBarIcon, BellIcon, SparklesIcon, ShieldCheckIcon, CpuChipIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { usePremium } from '../context/PremiumContext';
import { Link } from 'react-router-dom';
import PremiumCalendar from './PremiumCalendar';

export default function Productivity() {
  const { user } = useAuth();
  const { subscription, loading: premiumLoading } = usePremium();
  const isAdmin = user && user.email === 'rohit367673@gmail.com';
  const isPremium = subscription && subscription.plan && subscription.plan !== 'free';

  if ((isAdmin || isPremium) && !premiumLoading) {
    // Show the actual DeepSeek scheduling feature for admin/premium
    return <PremiumCalendar />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-200 via-purple-100 to-pink-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 animate-fade-in">
      <div className="backdrop-blur-xl bg-white/70 border border-purple-200 rounded-3xl shadow-2xl p-10 max-w-3xl w-full mx-auto relative overflow-hidden">
        {/* Decorative gradient blob */}
        <div className="absolute -top-20 -right-20 w-72 h-72 bg-gradient-to-br from-purple-400 via-pink-300 to-yellow-200 rounded-full opacity-30 blur-2xl z-0 animate-pulse" />
        <div className="relative z-10">
          <div className="flex justify-center mb-6">
            <span className="inline-block bg-gradient-to-r from-purple-500 to-pink-400 rounded-full p-4 animate-bounce shadow-lg">
              <SparklesIcon className="h-10 w-10 text-white" />
            </span>
          </div>
          <h1 className="text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 via-pink-600 to-yellow-500 mb-4 tracking-tight drop-shadow-lg">Productivity System</h1>
          <p className="mb-8 text-gray-800 text-xl max-w-xl mx-auto font-medium">Supercharge your planning, stay motivated, and achieve more with LifeBuddy Premium's Productivity System.</p>

          {/* AI-powered section */}
          <div className="bg-gradient-to-r from-blue-100 via-purple-100 to-pink-100 rounded-2xl p-6 mb-8 flex items-center gap-4 shadow-md border border-purple-100 animate-fade-in">
            <div className="bg-gradient-to-br from-purple-500 to-pink-400 rounded-full p-3 flex items-center justify-center">
              <CpuChipIcon className="h-8 w-8 text-white animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-purple-700 mb-1">AI-Powered Productivity</h2>
              <p className="text-gray-700">Get smart daily schedules, personalized reminders, and motivational boosts—automatically tailored to your goals and habits.</p>
            </div>
          </div>

          <ul className="text-left mb-8 text-gray-900 space-y-4 max-w-md mx-auto">
            <li className="flex items-center gap-3 text-lg"><CheckCircleIcon className="h-6 w-6 text-green-500" /> Smart daily scheduling</li>
            <li className="flex items-center gap-3 text-lg"><BellIcon className="h-6 w-6 text-blue-500" /> Personalized reminders</li>
            <li className="flex items-center gap-3 text-lg"><SparklesIcon className="h-6 w-6 text-yellow-500" /> Motivation & streak rewards</li>
            <li className="flex items-center gap-3 text-lg"><CalendarIcon className="h-6 w-6 text-purple-500" /> Full calendar & event analytics</li>
            <li className="flex items-center gap-3 text-lg"><ChartBarIcon className="h-6 w-6 text-pink-500" /> Progress & trend tracking</li>
            <li className="flex items-center gap-3 text-lg"><ShieldCheckIcon className="h-6 w-6 text-indigo-500" /> Priority support</li>
          </ul>
          {!(isAdmin || isPremium) && !premiumLoading && (
            <div className="flex justify-center">
              <a href="/premium" className="inline-block px-10 py-4 bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-400 text-white font-extrabold rounded-2xl shadow-xl hover:from-purple-600 hover:to-yellow-500 transition-all text-2xl tracking-wide animate-bounce-once">
                Upgrade for Full Access
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 