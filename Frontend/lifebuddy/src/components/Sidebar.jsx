import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { usePremium } from '../context/PremiumContext';
import {
  HomeIcon,
  CalendarIcon,
  ClipboardDocumentListIcon,
  UserGroupIcon,
  Cog6ToothIcon,
  ChartBarIcon,
  PlusIcon,
  TruckIcon,
  AcademicCapIcon,
  HeartIcon,
  MapPinIcon,
  GlobeAltIcon,
  UserIcon,
  WrenchScrewdriverIcon,
  StarIcon,
  ShoppingBagIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon },
  { name: 'Events', href: '/events', icon: CalendarIcon },
  { name: 'Daily Tools', href: '/daily-tools', icon: WrenchScrewdriverIcon },
  { name: 'Productivity System', href: '/productivity', icon: SparklesIcon, premium: true },
  { name: 'Analytics', href: '/analytics', icon: ChartBarIcon },
  { name: 'Profile', href: '/profile', icon: UserIcon },
  { name: 'Settings', href: '/settings', icon: Cog6ToothIcon },
];

const premiumNavigation = [
  { name: 'Upgrade', href: '/premium', icon: StarIcon },
  { name: 'Store', href: '/store', icon: ShoppingBagIcon },
];

const eventTypes = [
  { name: 'Moving', href: '/events/new?type=moving', icon: TruckIcon, color: 'text-blue-600 dark:text-blue-400' },
  { name: 'Job Change', href: '/events/new?type=job-change', icon: UserGroupIcon, color: 'text-green-600 dark:text-green-400' },
  { name: 'College', href: '/events/new?type=college', icon: AcademicCapIcon, color: 'text-purple-600 dark:text-purple-400' },
  { name: 'Wedding', href: '/events/new?type=wedding', icon: HeartIcon, color: 'text-pink-600 dark:text-pink-400' },
  { name: 'Trip', href: '/events/new?type=trip', icon: GlobeAltIcon, color: 'text-yellow-600 dark:text-yellow-400' },
  { name: 'Car Purchase', href: '/events/new?type=car-purchase', icon: TruckIcon, color: 'text-gray-600 dark:text-gray-400' },
];

const Sidebar = ({ open, onClose }) => {
  const location = useLocation();
  const { user } = useAuth();
  const { isDarkMode } = useTheme();
  const { hasPremiumAccess } = usePremium();

  const isActive = (href) => {
    if (href === '/dashboard') {
      return location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile sidebar */}
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <div className={`flex grow flex-col gap-y-5 overflow-y-auto px-6 pb-4 ${
                  isDarkMode ? 'bg-gray-800' : 'bg-white'
                }`}>
                  <div className="flex h-16 shrink-0 items-center justify-between">
                    <div className="flex items-center gap-2">
                      <img 
                        src="/lifebuddy-high-resolution-logo-transparent.png" 
                        alt="LifeBuddy Logo" 
                        className="w-20 h-14 object-contain"
                      />
                    </div>
                    <button
                      onClick={onClose}
                      className={`p-2 rounded-md ${
                        isDarkMode ? 'text-gray-400 hover:text-white hover:bg-gray-700' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                      }`}
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                      <li>
                        <ul role="list" className="-mx-2 space-y-1">
                          {navigation.map((item) => {
                            const hasAccess = !item.premium || hasPremiumAccess();
                            return (
                              <li key={item.name}>
                                <Link
                                  to={item.href}
                                  className={`
                                    group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors relative
                                    ${isActive(item.href)
                                      ? isDarkMode 
                                        ? 'bg-blue-900/50 text-blue-400' 
                                        : 'bg-blue-50 text-blue-600'
                                      : isDarkMode
                                        ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                                        : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                                    }
                                    ${!hasAccess ? 'opacity-75' : ''}
                                  `}
                                  onClick={onClose}
                                >
                                  <item.icon
                                    className={`h-6 w-6 shrink-0 ${
                                      isActive(item.href) 
                                        ? 'text-blue-600 dark:text-blue-400' 
                                        : isDarkMode
                                          ? 'text-gray-400 group-hover:text-white'
                                          : 'text-gray-400 group-hover:text-blue-600'
                                    }`}
                                    aria-hidden="true"
                                  />
                                  {item.name}
                                  {item.premium && !hasAccess && (
                                    <StarIcon className="h-4 w-4 text-yellow-500 ml-auto" />
                                  )}
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </li>
                      
                      <li>
                        <div className={`text-xs font-semibold leading-6 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-400'
                        }`}>Quick Add Event</div>
                        <ul role="list" className="-mx-2 mt-2 space-y-1">
                          {eventTypes.map((item) => (
                            <li key={item.name}>
                              <Link
                                to={item.href}
                                className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors ${
                                  isDarkMode
                                    ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                                }`}
                                onClick={onClose}
                              >
                                <item.icon
                                  className={`h-5 w-5 shrink-0 ${item.color}`}
                                  aria-hidden="true"
                                />
                                {item.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </li>
                      
                      <li>
                        <div className={`text-xs font-semibold leading-6 ${
                          isDarkMode ? 'text-gray-400' : 'text-gray-400'
                        }`}>Premium</div>
                        <ul role="list" className="-mx-2 mt-2 space-y-1">
                          {premiumNavigation.map((item) => (
                            <li key={item.name}>
                              <Link
                                to={item.href}
                                className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors ${
                                  isDarkMode
                                    ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                                    : 'text-gray-700 hover:text-purple-600 hover:bg-gray-50'
                                }`}
                                onClick={onClose}
                              >
                                <item.icon
                                  className={`h-5 w-5 shrink-0 ${
                                    isDarkMode ? 'text-purple-400' : 'text-purple-600'
                                  }`}
                                  aria-hidden="true"
                                />
                                {item.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </li>
                    </ul>
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-64 lg:flex-col">
        <div className={`flex grow flex-col gap-y-5 overflow-y-auto border-r px-6 pb-4 ${
          isDarkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'
        }`}>
          <div className="flex h-16 shrink-0 items-center">
            <div className="flex items-center gap-3">
              <img 
                src="/lifebuddy-high-resolution-logo-transparent.png" 
                alt="LifeBuddy Logo" 
                className="w-20 h-14 object-contain"
              />
            </div>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const hasAccess = !item.premium || hasPremiumAccess();
                    return (
                      <li key={item.name}>
                        <Link
                          to={item.href}
                          className={`
                            group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors relative
                            ${isActive(item.href)
                              ? isDarkMode 
                                ? 'bg-blue-900/50 text-blue-400' 
                                : 'bg-blue-50 text-blue-600'
                              : isDarkMode
                                ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                                : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                            }
                            ${!hasAccess ? 'opacity-75' : ''}
                          `}
                        >
                          <item.icon
                            className={`h-6 w-6 shrink-0 ${
                              isActive(item.href) 
                                ? 'text-blue-600 dark:text-blue-400' 
                                : isDarkMode
                                  ? 'text-gray-400 group-hover:text-white'
                                  : 'text-gray-400 group-hover:text-blue-600'
                            }`}
                            aria-hidden="true"
                          />
                          {item.name}
                          {item.premium && !hasAccess && (
                            <StarIcon className="h-4 w-4 text-yellow-500 ml-auto" />
                          )}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
              
              <li>
                <div className={`text-xs font-semibold leading-6 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-400'
                }`}>Quick Add Event</div>
                <ul role="list" className="-mx-2 mt-2 space-y-1">
                  {eventTypes.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors ${
                          isDarkMode
                            ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                            : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                        }`}
                      >
                        <item.icon
                          className={`h-5 w-5 shrink-0 ${item.color}`}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
              
              <li>
                <div className={`text-xs font-semibold leading-6 ${
                  isDarkMode ? 'text-gray-400' : 'text-gray-400'
                }`}>Premium</div>
                <ul role="list" className="-mx-2 mt-2 space-y-1">
                  {premiumNavigation.map((item) => (
                    <li key={item.name}>
                      <Link
                        to={item.href}
                        className={`group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold transition-colors ${
                          isDarkMode
                            ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                            : 'text-gray-700 hover:text-purple-600 hover:bg-gray-50'
                        }`}
                      >
                        <item.icon
                          className={`h-5 w-5 shrink-0 ${
                            isDarkMode ? 'text-purple-400' : 'text-purple-600'
                          }`}
                          aria-hidden="true"
                        />
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar; 