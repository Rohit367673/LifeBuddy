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

  // Handle navigation to login when user is not authenticated
  useEffect(() => {
    // Allow admin user to always access
    if (!loading && (!user || !user.email) && !isAuthPage) {
      navigate('/login');
    }
  }, [user, loading, isAuthPage, navigate]);

  // If loading, show loading spinner
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading LifeBuddy...</p>
        </div>
      </div>
    );
  }

  // Allow admin user to always access
  if ((!user || !user.email) && !isAuthPage) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  // If admin user, treat as authenticated
  const isAdmin = user && user.email === 'rohit367673@gmail.com';

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
        <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8 mt-4 sm:mt-6 lg:mt-8">
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