import { Link, useNavigate } from 'react-router-dom';
import {
  CalendarIcon,
  CheckCircleIcon,
  ChartBarIcon,
  UserGroupIcon,
  SparklesIcon,
  CpuChipIcon,
  ArrowRightIcon,
} from '@heroicons/react/24/outline';

const aiFeatures = [
  {
    name: 'AI-Powered Scheduling',
    description: 'Let our AI create smart daily plans tailored to your goals and habits.',
    icon: CpuChipIcon,
  },
  {
    name: 'Smart Reminders',
    description: 'Never miss a beat with intelligent, personalized notifications.',
    icon: SparklesIcon,
  },
  {
    name: 'Personal Analytics',
    description: 'Visualize your progress and get actionable insights with beautiful analytics.',
    icon: ChartBarIcon,
  },
  {
    name: 'Motivational Boosts',
    description: 'Stay inspired with AI-generated messages and streak rewards.',
    icon: CheckCircleIcon,
  },
];

const showcase = [
  {
    name: 'Profile Analysis',
    description: 'Get deep insights into your habits, achievements, and growth areas.',
    icon: UserGroupIcon,
    link: '/profile',
  },
  {
    name: 'Event Planning',
    description: 'Plan life events with structured checklists, timelines, and smart suggestions.',
    icon: CalendarIcon,
    link: '/events',
  },
  {
    name: 'Productivity Dashboard',
    description: 'Track your tasks, streaks, and progress in one beautiful dashboard.',
    icon: ChartBarIcon,
    link: '/dashboard',
  },
];

const eventTypes = [
  { name: 'Moving', description: 'Plan your move with checklists, budget tracking, and timeline management.' },
  { name: 'Job Change', description: 'Navigate career transitions with structured planning and resource guides.' },
  { name: 'College', description: 'Prepare for academic life with comprehensive planning tools and checklists.' },
  { name: 'Wedding', description: 'Organize your special day with detailed planning and vendor management.' },
  { name: 'Trip Planning', description: 'Plan your adventures with itinerary management and travel checklists.' },
  { name: 'Car Purchase', description: 'Make informed decisions with research tools and comparison features.' },
];

const Home = () => {
  const navigate = useNavigate();
  return (
    <div className="bg-gradient-to-br from-blue-100 via-purple-100 to-pink-100 min-h-screen">
      {/* Hero Section */}
      <header className="relative z-10 flex flex-col items-center justify-center pt-24 pb-16 text-center">
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute left-1/2 top-0 w-[60vw] h-[60vw] -translate-x-1/2 bg-gradient-to-br from-purple-400 via-pink-300 to-yellow-200 opacity-30 blur-3xl animate-pulse" />
        </div>
        <span className="inline-block bg-gradient-to-r from-purple-500 to-pink-400 rounded-full p-6 mb-6 animate-bounce shadow-lg">
          <span className="text-4xl font-extrabold text-white tracking-widest select-none" style={{fontFamily: 'monospace'}}>LB</span>
        </span>
        <h1 className="text-5xl sm:text-6xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-purple-700 via-pink-600 to-yellow-500 drop-shadow-lg mb-4">
          LifeBuddy: Your AI Life Organizer
        </h1>
        <p className="text-xl sm:text-2xl text-gray-700 max-w-2xl mx-auto mb-8 font-medium">
          Supercharge your life with AI-powered planning, analytics, and motivation. Organize events, track progress, and unlock your best self.
        </p>
        <div className="flex flex-wrap justify-center gap-4 mb-6">
          <Link to="/signup" className="px-8 py-4 rounded-2xl bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-400 text-white font-bold text-xl shadow-xl hover:from-purple-600 hover:to-yellow-500 transition-all animate-bounce-once">
            Get Started Free
          </Link>
          <Link to="/login" className="px-8 py-4 rounded-2xl bg-white/80 text-purple-700 font-bold text-xl shadow hover:bg-white/90 border border-purple-200">
            Sign In
          </Link>
        </div>
      </header>

      {/* AI Features Section */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-10 text-transparent bg-clip-text bg-gradient-to-r from-purple-700 via-pink-600 to-yellow-500">AI Features</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
          {aiFeatures.map((feature) => (
            <div key={feature.name} className="glassmorphism-card p-6 rounded-3xl shadow-xl flex flex-col items-center text-center hover:scale-105 transition-transform bg-white/60 backdrop-blur-lg border border-purple-100">
              <feature.icon className="h-10 w-10 mb-3 text-purple-500 animate-pulse" />
              <h3 className="font-bold text-lg mb-2 text-purple-700">{feature.name}</h3>
              <p className="text-gray-700 text-base">{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Showcase Section */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-10 text-transparent bg-clip-text bg-gradient-to-r from-blue-700 via-purple-600 to-pink-500">Explore LifeBuddy</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {showcase.map((item) => (
            <button
              key={item.name}
              className="group glassmorphism-card p-8 rounded-3xl shadow-2xl flex flex-col items-center text-center bg-white/70 backdrop-blur-xl border border-blue-100 cursor-pointer hover:scale-105 transition-transform focus:outline-none"
              onClick={() => navigate('/login')}
              type="button"
            >
              <item.icon className="h-12 w-12 mb-4 text-blue-500 group-hover:animate-bounce" />
              <h3 className="font-extrabold text-xl mb-2 text-blue-700">{item.name}</h3>
              <p className="text-gray-700 text-base mb-4">{item.description}</p>
              <span className="inline-flex items-center gap-1 text-blue-600 font-semibold group-hover:underline">
                Learn More <ArrowRightIcon className="h-4 w-4" />
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Event Types Section */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 text-transparent bg-clip-text bg-gradient-to-r from-pink-700 via-yellow-600 to-purple-500">Plan Any Life Event</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {eventTypes.map((event) => (
            <div key={event.name} className="glassmorphism-card p-6 rounded-2xl shadow-lg bg-white/60 backdrop-blur-md border border-pink-100">
              <h3 className="font-bold text-lg mb-2 text-pink-700">{event.name}</h3>
              <p className="text-gray-700 text-base">{event.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-3xl sm:text-4xl font-extrabold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-700 via-pink-600 to-yellow-500">Ready to unlock your future?</h2>
        <p className="text-lg text-gray-700 mb-8">Join thousands using LifeBuddy to organize, analyze, and achieve more with AI-powered tools.</p>
        <Link to="/signup" className="px-12 py-5 rounded-3xl bg-gradient-to-r from-purple-500 via-pink-500 to-yellow-400 text-white font-extrabold text-2xl shadow-2xl hover:from-purple-600 hover:to-yellow-500 transition-all animate-bounce-once">
          Start Your Free Account
        </Link>
      </section>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto px-6 py-12">
        <div className="border-t border-gray-200 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-purple-600">LifeBuddy</span>
            <span className="ml-2 text-sm text-gray-500">Your AI-powered life, organized</span>
          </div>
          <div className="flex space-x-6 text-sm text-gray-500">
            <a href="#" className="hover:text-purple-600">Privacy</a>
            <a href="#" className="hover:text-purple-600">Terms</a>
            <a href="#" className="hover:text-purple-600">Support</a>
          </div>
        </div>
      </footer>

      {/* Glassmorphism utility (optional, for custom style) */}
      <style>{`
        .glassmorphism-card {
          background: rgba(255,255,255,0.7);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.10);
          backdrop-filter: blur(12px);
          border-radius: 1.5rem;
          border: 1px solid rgba(255,255,255,0.18);
        }
        .animate-spin-slow {
          animation: spin 4s linear infinite;
        }
        .animate-bounce-once {
          animation: bounce 1s 1;
        }
      `}</style>
    </div>
  );
};

export default Home; 