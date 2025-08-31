import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { FaEye, FaEyeSlash, FaGoogle } from 'react-icons/fa';
import { EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';
import DebugInfo from '../components/DebugInfo';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { login, loginTraditional, loginWithGoogle, user, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    
    try {
      await loginTraditional(email, password);
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      setErrors({ general: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    console.log('🔥 Google login button clicked!');
    
    setGoogleLoading(true);
    setErrors({});
    
    try {
      console.log('🚀 Calling loginWithGoogle...');
      await loginWithGoogle();
      console.log('✅ loginWithGoogle completed successfully');
      // Navigation will be handled by useEffect below
    } catch (error) {
      console.error('❌ Google login error:', error);
      setErrors({ general: error.message });
      setGoogleLoading(false);
    }
  };

  // Test Firebase configuration on component mount
  useEffect(() => {
    console.log('🧪 Running Firebase tests...');
    testFirebaseConfig();
    testGoogleProvider();
  }, []);

  // Navigate to dashboard when user is authenticated
  useEffect(() => {
    console.log('🔍 Login page useEffect - User:', user?.email, 'AuthLoading:', authLoading);
    if (!authLoading && user?.email) {
      console.log('✅ Login page: User authenticated, navigating to dashboard');
      setGoogleLoading(false); // Clear Google loading state
      navigate('/dashboard');
    }
  }, [user, authLoading, navigate]);

  // Check for redirect login in progress and handle timeout
  useEffect(() => {
    const wasGoogleLoginInProgress = sessionStorage.getItem('googleLoginInProgress');
    const loginTimestamp = sessionStorage.getItem('googleLoginTimestamp');
    
    if (wasGoogleLoginInProgress) {
      // Check if login attempt is stale (more than 5 minutes)
      const isStale = loginTimestamp && (Date.now() - parseInt(loginTimestamp)) > 300000;
      
      if (isStale) {
        console.log('Stale Google login attempt detected, clearing...');
        sessionStorage.removeItem('googleLoginInProgress');
        sessionStorage.removeItem('googleLoginTimestamp');
        setGoogleLoading(false);
        setErrors({ general: 'Google login timed out. Please try again.' });
      } else {
        setGoogleLoading(true);
        
        // Set a timeout to clear loading state if redirect doesn't complete
        const timeoutId = setTimeout(() => {
          console.log('Google login timeout reached, clearing loading state...');
          sessionStorage.removeItem('googleLoginInProgress');
          sessionStorage.removeItem('googleLoginTimestamp');
          setGoogleLoading(false);
          setErrors({ general: 'Google login timed out. Please try again.' });
        }, 30000); // 30 second timeout
        
        return () => clearTimeout(timeoutId);
      }
    }
  }, []);

  return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-2">
      <div className="max-w-md w-full space-y-8">
        <div>
          <Link to="/" className="flex justify-center">
            <span className="text-3xl font-bold text-primary-600">LifeBuddy</span>
          </Link>
          <h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link to="/signup" className="font-medium text-primary-600 hover:text-primary-500">
              create a new account
            </Link>
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {errors.general && (
            <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded-lg">
              {errors.general}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="label">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input"
                placeholder="Enter your email"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="label">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-10"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                  ) : (
                    <EyeIcon className="h-5 w-5 text-gray-400" />
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div className="text-sm">
              <a href="#" className="font-medium text-primary-600 hover:text-primary-500">
                Forgot your password?
              </a>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary w-full py-3 text-base"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <div className="spinner w-5 h-5 mr-2"></div>
                  Signing in...
                </div>
              ) : (
                'Sign in'
              )}
            </button>
          </div>

        </form>

        <div className="relative mt-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-gray-50 px-2 text-gray-500">Or continue with</span>
          </div>
        </div>

        <div className="flex flex-col space-y-4 mt-6">
          <button
            type="button"
            onClick={async (e) => {
              e.preventDefault();
              e.stopPropagation();
              console.log('🔥 BUTTON CLICK - Google login triggered!', { loading, authLoading, googleLoading });
              
              // Clear any existing auth cookies first (centralized helper)
              clearAuthCookies();
              console.log('🧹 Cleared existing auth cookies');
              
              if (loading || authLoading || googleLoading) {
                console.log('⚠️ Button disabled, ignoring click');
                return;
              }
              
              setGoogleLoading(true);
              try {
                console.log('🚀 Starting Google login...');
                await loginWithGoogle();
                console.log('✅ Google login completed');
              } catch (error) {
                console.error('❌ Google login error:', error);
                setErrors({ general: error.message });
                setGoogleLoading(false);
              }
            }}
            disabled={loading || authLoading || googleLoading}
            className="flex items-center justify-center w-full px-4 py-3 border border-gray-300 rounded-lg shadow-sm bg-white text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
          >
            {googleLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-600 mr-2"></div>
                <span>Signing in with Google...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span>Continue with Google</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Debug component for troubleshooting */}
      <DebugInfo />
    </div>
  );
};

export default Login;