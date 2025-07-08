import { Link } from 'react-router-dom';
import { 
  CalendarIcon, 
  CheckCircleIcon, 
  ChartBarIcon,
  UserGroupIcon,
  SparklesIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

const Home = () => {
  const features = [
    {
      name: 'Life Event Planning',
      description: 'Organize major life transitions like moving, job changes, and college with structured checklists and timelines.',
      icon: CalendarIcon,
    },
    {
      name: 'Daily Tools',
      description: 'Access powerful productivity tools including to-do lists, notes, mood tracking, and weekly planners.',
      icon: CheckCircleIcon,
    },
    {
      name: 'Progress Tracking',
      description: 'Visualize your progress with charts and analytics to stay motivated and on track.',
      icon: ChartBarIcon,
    },
    {
      name: 'Smart Reminders',
      description: 'Never miss important deadlines with intelligent notifications and customizable reminders.',
      icon: SparklesIcon,
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

  return (
    <div className="bg-white">
      {/* Header */}
      <header className="absolute inset-x-0 top-0 z-50">
        <nav className="flex items-center justify-between p-6 lg:px-8" aria-label="Global">
          <div className="flex lg:flex-1">
            <Link to="/" className="-m-1.5 p-1.5">
              <span className="text-2xl font-bold text-primary-600">LifeBuddy</span>
            </Link>
          </div>
          <div className="flex gap-x-12">
            <Link to="/login" className="text-sm font-semibold leading-6 text-gray-900 hover:text-primary-600">
              Sign in
            </Link>
            <Link to="/signup" className="text-sm font-semibold leading-6 text-gray-900 hover:text-primary-600">
              Sign up
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero section */}
      <div className="relative isolate pt-14">
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80" aria-hidden="true">
          <div
            className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-primary-600 to-purple-600 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
            style={{
              clipPath:
                'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
            }}
          />
        </div>

        <div className="py-24 sm:py-32 lg:pb-40">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl">
                Your Life,{' '}
                <span className="text-primary-600">Organized</span>
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600">
                Navigate life's biggest moments with confidence. LifeBuddy helps you plan, track, and manage everything from daily tasks to major life transitions.
              </p>
              <div className="mt-10 flex items-center justify-center gap-x-6">
                <Link to="/login" className="text-base font-semibold leading-6 text-gray-900 hover:text-primary-600">
                  Sign in <span aria-hidden="true">→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features section */}
      <div className="mx-auto mt-32 max-w-7xl px-6 sm:mt-40 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-primary-600">Everything you need</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Powerful tools for life's biggest moments
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            Whether you're planning a move, starting a new job, or just want to stay organized, LifeBuddy has the tools you need to succeed.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-2">
            {features.map((feature) => (
              <div key={feature.name} className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <feature.icon className="h-5 w-5 flex-none text-primary-600" aria-hidden="true" />
                  {feature.name}
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">{feature.description}</p>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      {/* Event types section */}
      <div className="mx-auto mt-32 max-w-7xl px-6 sm:mt-40 lg:px-8">
        <div className="mx-auto max-w-2xl lg:text-center">
          <h2 className="text-base font-semibold leading-7 text-primary-600">Life Events</h2>
          <p className="mt-2 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Ready for any life transition
          </p>
          <p className="mt-6 text-lg leading-8 text-gray-600">
            From moving to a new city to starting college, we've got you covered with specialized planning tools for every major life event.
          </p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {eventTypes.map((event) => (
              <div key={event.name} className="card p-6 hover:shadow-medium transition-shadow">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{event.name}</h3>
                <p className="text-gray-600">{event.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA section */}
      <div className="mx-auto mt-32 max-w-7xl px-6 sm:mt-40 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            Ready to get organized?
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-gray-600">
            Join thousands of people who are already using LifeBuddy to manage their life events and daily tasks.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link
              to="/signup"
              className="btn-primary text-base px-8 py-3"
            >
              Start your free account
            </Link>
            <Link to="/login" className="text-base font-semibold leading-6 text-gray-900 hover:text-primary-600">
              Sign in <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mx-auto mt-32 max-w-7xl px-6 py-12 sm:mt-40 lg:px-8">
        <div className="border-t border-gray-200 pt-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-xl font-bold text-primary-600">LifeBuddy</span>
              <span className="ml-4 text-sm text-gray-500">Your life, organized</span>
            </div>
            <div className="flex space-x-6 text-sm text-gray-500">
              <a href="#" className="hover:text-primary-600">Privacy</a>
              <a href="#" className="hover:text-primary-600">Terms</a>
              <a href="#" className="hover:text-primary-600">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home; 