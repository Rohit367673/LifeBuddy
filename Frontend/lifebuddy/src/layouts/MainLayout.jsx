import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Toaster } from 'react-hot-toast';

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, loading } = useAuth();
  const { isDarkMode } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  // Don't show layout for auth pages
  const isAuthPage = ['/login', '/signup', '/'].includes(location.pathname);
  
  // Prevent redirect loops by checking if we're already on login or signup page
  const isOnLoginPage = location.pathname === '/login';
  const isOnSignupPage = location.pathname === '/signup';

  // Handle navigation to login when user is not authenticated
  useEffect(() => {
    console.log('🔍 MainLayout useEffect triggered:');
    console.log('  - User:', user);
    console.log('  - Loading:', loading);
    console.log('  - IsAuthPage:', isAuthPage);
    console.log('  - IsOnLoginPage:', isOnLoginPage);
    console.log('  - IsOnSignupPage:', isOnSignupPage);
    console.log('  - Current pathname:', location.pathname);
    
    // If user is not authenticated and not on an auth page, redirect to login
    if (!loading && !user && !isAuthPage) {
      console.log('User not authenticated, redirecting to login page');
      navigate('/login');
      return;
    }
    
    // If user is authenticated and we're on login page, redirect to dashboard
    if (!loading && user && user.email && isOnLoginPage) {
      console.log('User is authenticated, redirecting to dashboard');
      navigate('/dashboard');
    }
    
    // If user is authenticated and we're on signup page, redirect to dashboard
    // BUT only if they're already logged in (not if they're trying to sign up)
    if (!loading && user && user.email && isOnSignupPage) {
      console.log('User is authenticated, redirecting to dashboard');
      navigate('/dashboard');
    }
  }, [user, loading, isAuthPage, isOnLoginPage, isOnSignupPage, navigate, location.pathname]);

  // If loading, show loading spinner
  if (loading) {
    console.log('🔄 MainLayout: Showing loading spinner');
    console.log('👤 User:', user);
    console.log('👤 User email:', user?.email);
    console.log('⏱️ Loading state:', loading);
    console.log('🔍 User exists:', !!user);
    console.log('🔍 User has email:', !!(user && user.email));
    
    // Add a fallback: if user is authenticated but loading is stuck, show dashboard anyway
    if (user && user.email) {
      console.log('🚀 User is authenticated, showing dashboard despite loading state');
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Navbar onMenuClick={() => setSidebarOpen(true)} />
          <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
          <div className="lg:pl-64">
            <main className="py-10">
              <div className="mx-auto max-w-7xl px-2 sm:px-4 lg:px-6">
                <Outlet />
              </div>
            </main>
          </div>
          <Toaster 
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: isDarkMode ? '#1f2937' : '#363636',
                color: '#fff',
              },
              success: {
                duration: 3000,
                iconTheme: {
                  primary: '#22c55e',
                  secondary: '#fff',
                },
              },
              error: {
                duration: 5000,
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#fff',
                },
              },
            }}
          />
        </div>
      );
    }
    
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading LifeBuddy...</p>
        </div>
      </div>
    );
  }

  // If we're on an auth page, don't check authentication
  if (isAuthPage) {
    return (
      <>
        <Outlet />
        <Toaster 
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: isDarkMode ? '#1f2937' : '#363636',
              color: '#fff',
            },
            success: {
              duration: 3000,
              iconTheme: {
                primary: '#22c55e',
                secondary: '#fff',
              },
            },
            error: {
              duration: 5000,
              iconTheme: {
                primary: '#ef4444',
                secondary: '#fff',
              },
            },
          }}
        />
      </>
    );
  }

  // If user is not authenticated and not loading, redirect to login
  if (!user && !loading) {
    console.log('User not authenticated and not loading, redirecting to login');
    navigate('/login');
    return null;
  }

  // If admin user, treat as authenticated
  const isAdmin = user && user.email === 'rohit367673@gmail.com';

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar onMenuClick={() => setSidebarOpen(true)} />
      
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      <main className="lg:pl-64 transition-all duration-300">
        <div className="p-8">
          {/* If admin, allow access to all features */}
          <Outlet />
        </div>
      </main>

      <Toaster 
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: isDarkMode ? '#1f2937' : '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#22c55e',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#ef4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
};

export default MainLayout; 