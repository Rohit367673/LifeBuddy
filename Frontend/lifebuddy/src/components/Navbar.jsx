import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { 
  Bars3Icon, 
  BellIcon, 
  UserCircleIcon,
  Cog6ToothIcon,
  ArrowRightOnRectangleIcon,
  SunIcon,
  MoonIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { Menu, Transition } from '@headlessui/react';
import { Fragment } from 'react';

// Helper function to process Google avatar URL with multiple fallbacks
const processAvatarUrl = (url) => {
  if (!url) return null;
  
  // If it's a Google avatar URL, try different approaches
  if (url.includes('googleusercontent.com')) {
    // Try to remove any existing size parameters and use a standard size
    const cleanUrl = url.split('=')[0];
    // Try different size parameters
    return `${cleanUrl}=s96-c`;
  }
  
  return url;
};

// Helper function to create a fallback URL
const createFallbackUrl = (url) => {
  if (!url) return null;
  
  if (url.includes('googleusercontent.com')) {
    const cleanUrl = url.split('=')[0];
    // Try a different size parameter
    return `${cleanUrl}=s48-c`;
  }
  
  return url;
};

// Helper function to create a proxy URL for Google images
const createProxyUrl = (url) => {
  if (!url) return null;
  
  if (url.includes('googleusercontent.com')) {
    // Use a proxy service to bypass CORS issues
    return `https://images.weserv.nl/?url=${encodeURIComponent(url)}&w=96&h=96&fit=cover&output=webp`;
  }
  
  return url;
};

const Navbar = ({ onMenuClick }) => {
  const { user, firebaseUser, logout } = useAuth();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const [notifications] = useState([]);
  const [notificationsOn, setNotificationsOn] = useState(() => {
    const saved = localStorage.getItem('notificationsOn');
    return saved === null ? true : saved === 'true';
  });
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    localStorage.setItem('notificationsOn', notificationsOn);
  }, [notificationsOn]);

  const handleToggleNotifications = () => {
    setAnimating(true);
    setNotificationsOn((prev) => !prev);
    setTimeout(() => setAnimating(false), 400);
    // Optionally, sync with backend settings here
  };

  const handleLogout = async () => {
    await logout();
  };

  return (
    <nav className={`border-b fixed top-0 left-0 right-0 z-30 transition-colors ${
      isDarkMode 
        ? 'bg-gray-800 border-gray-700 lg:border-l lg:border-l-gray-700' 
        : 'bg-white border-gray-200 lg:border-l lg:border-l-gray-200'
    } lg:border-b-0 lg:pl-64`}>
      <div className="px-2 sm:px-4 lg:px-6">
        <div className="flex justify-between h-16">
          {/* Left side */}
          <div className="flex items-center">
            <button
              type="button"
              className={`lg:hidden -m-2.5 p-2.5 rounded-md transition-colors ${
                isDarkMode 
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                  : 'text-gray-700 hover:text-gray-900 hover:bg-gray-100'
              }`}
              onClick={onMenuClick}
            >
              <span className="sr-only">Open sidebar</span>
              <Bars3Icon className="h-6 w-6" aria-hidden="true" />
            </button>
            
            <div className="hidden lg:flex lg:items-center lg:space-x-4">
              <div className="flex items-center gap-3">
                <img 
                  src="/lifebuddy-high-resolution-logo-transparent.png" 
                  alt="LifeBuddy Logo" 
                  className="w-14 h-14 object-contain"
                />
              </div>
              <span className={`text-sm ${
                isDarkMode ? 'text-gray-400' : 'text-gray-500'
              }`}>Your life, organized</span>
            </div>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-2 sm:space-x-4">
            {/* Dark mode toggle */}
            <button
              type="button"
              onClick={toggleDarkMode}
              className={`p-2 rounded-md transition-colors ${
                isDarkMode 
                  ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                  : 'text-gray-400 hover:text-gray-500 hover:bg-gray-100'
              }`}
            >
              <span className="sr-only">Toggle dark mode</span>
              {isDarkMode ? (
                <SunIcon className="h-5 w-5" />
              ) : (
                <MoonIcon className="h-5 w-5" />
              )}
            </button>

            {/* Notifications */}
            <button
              type="button"
              onClick={handleToggleNotifications}
              className={`relative p-2 rounded-md transition-colors flex items-center gap-2 group ${
                notificationsOn
                  ? 'bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-lg' 
                  : isDarkMode 
                    ? 'text-gray-300 hover:text-white hover:bg-gray-700' 
                    : 'text-gray-400 hover:text-gray-500 hover:bg-gray-100'
              } ${animating ? 'scale-110 ring-2 ring-green-400' : ''}`}
              style={{ transition: 'all 0.3s cubic-bezier(.4,2,.6,1)' }}
            >
              <span className="sr-only">Toggle notifications</span>
              <BellIcon 
                className={`h-6 w-6 transition-all duration-300 ${notificationsOn ? 'fill-green-400 text-white' : ''} ${animating ? 'animate-bounce' : ''}`}
                aria-hidden="true" 
              />
              <span className={`text-xs font-semibold transition-colors duration-300 ${notificationsOn ? 'text-white' : isDarkMode ? 'text-gray-300' : 'text-gray-500'}`}>
                {notificationsOn ? 'On' : 'Off'}
              </span>
            </button>

            {/* User menu */}
            <Menu as="div" className="relative">
              <Menu.Button className={`flex items-center space-x-2 sm:space-x-3 text-sm rounded-full transition-colors ${
                isDarkMode 
                  ? 'hover:bg-gray-700' 
                  : 'hover:bg-gray-100'
              } p-1`}>
                <span className="sr-only">Open user menu</span>
                {user?.avatar || firebaseUser?.photoURL ? (
                  <img
                    className="h-8 w-8 rounded-full"
                    src={processAvatarUrl(user?.avatar || firebaseUser?.photoURL)}
                    alt={user?.displayName || firebaseUser?.displayName || 'User'}
                    onError={(e) => {
                      // Try fallback URL first
                      const fallbackUrl = createFallbackUrl(user?.avatar || firebaseUser?.photoURL);
                      if (fallbackUrl && fallbackUrl !== e.target.src) {
                        e.target.src = fallbackUrl;
                      } else {
                        // Try proxy URL as last resort
                        const proxyUrl = createProxyUrl(user?.avatar || firebaseUser?.photoURL);
                        if (proxyUrl && proxyUrl !== e.target.src) {
                          e.target.src = proxyUrl;
                        } else {
                          e.target.style.display = 'none';
                          e.target.nextSibling.style.display = 'flex';
                        }
                      }
                    }}
                    onLoad={(e) => {
                      e.target.nextSibling.style.display = 'none';
                    }}
                  />
                ) : null}
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center" style={{ display: (user?.avatar || firebaseUser?.photoURL) ? 'none' : 'flex' }}>
                  {user?.displayName ? (
                    <span className="text-xs font-semibold text-white">
                      {user.displayName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </span>
                  ) : (
                    <UserIcon className="h-4 w-4 text-white" />
                  )}
                </div>
                <span className="hidden sm:block text-left">
                  <span className={`block text-sm font-medium ${
                    isDarkMode ? 'text-gray-200' : 'text-gray-700'
                  }`}>
                    {user?.displayName || firebaseUser?.displayName || 'User'}
                  </span>
                  <span className={`block text-xs ${
                    isDarkMode ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    {user?.email}
                  </span>
                </span>
              </Menu.Button>

              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className={`absolute right-0 mt-2 w-48 origin-top-right rounded-md py-1 shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none ${
                  isDarkMode 
                    ? 'bg-gray-800 ring-gray-700' 
                    : 'bg-white'
                }`}>
                  <Menu.Item>
                    {({ active }) => (
                      <a
                        href="/settings"
                        className={`${
                          active 
                            ? isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                            : ''
                        } flex items-center px-4 py-2 text-sm transition-colors ${
                          isDarkMode ? 'text-gray-200' : 'text-gray-700'
                        }`}
                      >
                        <Cog6ToothIcon className="mr-3 h-4 w-4" />
                        Settings
                      </a>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={handleLogout}
                        className={`${
                          active 
                            ? isDarkMode ? 'bg-gray-700' : 'bg-gray-100'
                            : ''
                        } flex w-full items-center px-4 py-2 text-sm transition-colors ${
                          isDarkMode ? 'text-gray-200' : 'text-gray-700'
                        }`}
                      >
                        <ArrowRightOnRectangleIcon className="mr-3 h-4 w-4" />
                        Sign out
                      </button>
                    )}
                  </Menu.Item>
                </Menu.Items>
              </Transition>
            </Menu>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar; 