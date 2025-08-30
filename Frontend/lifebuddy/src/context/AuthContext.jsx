import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithRedirect,
  getRedirectResult,
  updateProfile,
  signInWithPopup,
  sendEmailVerification
} from 'firebase/auth';
import { auth } from '../utils/firebaseConfig';
import { getApiUrl, logConfig } from '../utils/config';
import { getApiUrl as getBackendUrl } from '../utils/backendManager';
import { 
  setAuthToken, 
  getAuthToken, 
  removeAuthToken, 
  setUserData, 
  getUserData, 
  removeUserData, 
  clearAuthCookies,
  areCookiesEnabled 
} from '../utils/cookies';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import UsernameModal from '../components/UsernameModal';
import { switchBackend } from '../utils/backendManager';
import apiClient from '../utils/apiClient';

const AuthContext = createContext();

// Global singleton to prevent multiple auth initializations
let authInitialized = false;
let authInitializing = false;
let globalAuthState = {
  user: null,
  token: null,
  loading: true,
  firebaseUser: null
};

// Global instance counter for debugging
let instanceCount = 0;

// Explicit export to fix Fast Refresh issues
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Explicit export to fix Fast Refresh issues
export const AuthProvider = ({ children }) => {
  instanceCount++;
  const currentInstance = instanceCount;
  console.log(`🔄 AuthProvider mounting - instance #${currentInstance}, initialized:`, authInitialized, 'initializing:', authInitializing);
  
  const [user, setUser] = useState(globalAuthState.user);
  const [firebaseUser, setFirebaseUser] = useState(globalAuthState.firebaseUser);
  const [loading, setLoading] = useState(globalAuthState.loading);
  const [token, setToken] = useState(globalAuthState.token);
  const [awaitingEmailVerification, setAwaitingEmailVerification] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [pendingGoogleUser, setPendingGoogleUser] = useState(null);
  const tokenExpiryTimeoutRef = useRef(null);
  const initializingRef = useRef(false);
  const hasInitializedRef = useRef(false); // Track if this instance has completed initialization
  const navigate = useNavigate();
  const [authLoading, setAuthLoading] = useState(false); // Define setAuthLoading here

  // Get authentication token (ALWAYS use backend JWT, never Google ID token)
  const getFirebaseToken = async () => {
    // Always return the backend-issued JWT token
    return token;
  };

  // Utility: probe the Firebase handler init endpoint to know if redirect can work
  const canUseRedirectHandler = async () => {
    try {
      const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || `${import.meta.env.VITE_FIREBASE_PROJECT_ID}.firebaseapp.com`;
      if (!authDomain) return false;
      const url = `https://${authDomain}/__/firebase/init.json`;
      const res = await fetch(url, { method: 'GET', mode: 'no-cors' }).catch(() => null);
      // With no-cors we cannot read status; consider reachable only if no network error
      return !!res;
    } catch (_) {
      return false;
    }
  };

  // Traditional registration (without Firebase)
  const registerTraditional = async (email, password, displayName, firstName = '', lastName = '', username = '') => {
    try {
      setLoading(true);
      
      const response = await fetch(`${getApiUrl()}/api/auth/register-traditional`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          displayName,
          firstName,
          lastName,
          username
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Registration failed');
      }

      const data = await response.json();
      setToken(data.token);
      setUser(data.user);
      toast.success('Registration successful!');
      return data;
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Registration failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Decode JWT safely (no external dependency)
  const decodeJwt = (jwtToken) => {
    try {
      const base64Url = jwtToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      return null;
    }
  };

  const clearAutoLogoutTimer = () => {
    if (tokenExpiryTimeoutRef.current) {
      clearTimeout(tokenExpiryTimeoutRef.current);
      tokenExpiryTimeoutRef.current = null;
    }
  };

  const scheduleAutoLogout = (jwtToken) => {
    clearAutoLogoutTimer();
    if (!jwtToken) return;
    const decoded = decodeJwt(jwtToken);
    if (!decoded || !decoded.exp) return;
    const expiresAtMs = decoded.exp * 1000;
    const timeLeftMs = expiresAtMs - Date.now();
    if (timeLeftMs <= 0) {
      // Already expired
      handleSessionExpired();
      return;
    }
    tokenExpiryTimeoutRef.current = setTimeout(() => {
      handleSessionExpired();
    }, timeLeftMs);
  };

  const handleSessionExpired = async () => {
    try {
      toast.error('Your session has expired. Please log in again.');
      await logout();
    } catch (_) {
      // ignore
    }
  };

  // Traditional login (without Firebase)
  const loginTraditional = async (email, password) => {
    try {
      setLoading(true);
      
      const response = await fetch(`${getApiUrl()}/api/auth/login-traditional`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Login failed');
      }

      const data = await response.json();
      setToken(data.token);
      setUser(data.user);
      toast.success('Login successful!');
      return data;
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'Login failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Register user with Firebase, send verification email, then wait to finalize
  const register = async (email, password, displayName) => {
    try {
      setLoading(true);
      
      // Use real Firebase authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Update profile with display name
      await updateProfile(firebaseUser, { displayName });

      // Send OTP verification email via backend
      const response = await fetch(`${getApiUrl()}/api/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          firebaseUid: firebaseUser.uid
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send OTP');
      }

      setFirebaseUser(firebaseUser);
      setAwaitingEmailVerification(true);
      toast.success('OTP sent to your email. Please check your inbox and enter the 6-digit code.');
      return { verificationSent: true };
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Failed to create account');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Verify OTP code
  const verifyOTP = async (otpCode) => {
    try {
      setLoading(true);
      const fu = auth?.currentUser;
      if (!fu) throw new Error('No authenticated user. Please login again.');

      const response = await fetch(`${getApiUrl()}/api/auth/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: fu.email,
          firebaseUid: fu.uid,
          otp: otpCode
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Invalid OTP code');
      }

      // Mark email as verified in Firebase
      await fu.reload();
      toast.success('Email verified successfully!');
      return true;
    } catch (error) {
      console.error('OTP verification error:', error);
      toast.error(error.message || 'OTP verification failed');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // After the user verifies their email, finalize backend registration and optionally set avatar
  const finalizeEmailRegistration = async (displayName, avatar = '') => {
    try {
      setLoading(true);
      const fu = auth?.currentUser;
      if (!fu) throw new Error('No authenticated user. Please login again.');
      await fu.reload();
      if (!fu.emailVerified) {
        throw new Error('Email not verified yet. Please verify via the link in your inbox.');
      }

      const response = await fetch(`${getApiUrl()}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firebaseUid: fu.uid,
          email: fu.email,
          displayName: displayName || fu.displayName || (fu.email ? fu.email.split('@')[0] : 'User'),
          avatar: avatar || fu.photoURL || ''
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to register user in backend');
      }

      const data = await response.json();
      setToken(data.token);
      setFirebaseUser(fu);
      setUser(data.user);
      fetchUserProfile(data.token);
      setAwaitingEmailVerification(false);
      toast.success('Account verified and created successfully!');
      return data;
    } catch (error) {
      console.error('Finalize registration error:', error);
      toast.error(error.message || 'Failed to complete registration');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP verification email
  const resendVerificationEmail = async () => {
    try {
      const fu = auth.currentUser;
      if (!fu) throw new Error('Not signed in.');
      
      const response = await fetch(`${getApiUrl()}/api/auth/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: fu.email,
          firebaseUid: fu.uid
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to resend OTP');
      }

      toast.success('OTP re-sent to your email.');
    } catch (err) {
      toast.error(err.message || 'Could not resend OTP');
      throw err;
    }
  };

  // Login user
  const login = async (email, password) => {
    try {
      setLoading(true);
      
      // Use real Firebase authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Get Firebase token
      const firebaseToken = await firebaseUser.getIdToken();
      
      // Login to backend
      const response = await fetch(`${getApiUrl()}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: firebaseUser.uid,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to login to backend');
      }

      const data = await response.json();
      setToken(data.token);
      setFirebaseUser(firebaseUser);
      setUser(data.user); // Set user immediately for fast UI feedback
      fetchUserProfile(data.token); // Update with latest info in background
      console.log('AuthContext: user set after login/register:', data.user);
      console.log('AuthContext: firebaseUser set after login/register:', firebaseUser);
      
      toast.success('Welcome back!');
      return data;
    } catch (error) {
      console.error('Login error:', error);
      toast.error(error.message || 'Failed to login');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Google login
  const loginWithGoogle = async () => {
    try {
      console.log('🔥 Google login initiated');
      setLoading(true);
      
      // Check if Firebase is properly initialized
      console.log('🔥 Firebase Auth Check:', {
        auth: !!auth,
        authCurrentUser: auth?.currentUser,
        projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
        authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN
      });
      
      // Fast fail if Firebase isn't initialized
      if (!auth) {
        const hint =
          !import.meta.env.VITE_FIREBASE_API_KEY ? 'Missing VITE_FIREBASE_API_KEY' :
          !import.meta.env.VITE_FIREBASE_PROJECT_ID ? 'Missing VITE_FIREBASE_PROJECT_ID' :
          !import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ? 'Missing VITE_FIREBASE_AUTH_DOMAIN' :
          'Firebase not initialized';
        throw new Error(`Firebase Auth not available. ${hint}`);
      }
      
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      // Configure provider for better cross-browser compatibility
      provider.setCustomParameters({
        prompt: 'select_account',
        access_type: 'offline'
      });
      
      // Detect browser type for optimal auth method
      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      const isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      console.log('🔥 Browser detection:', { isSafari, isFirefox, isMobile });
      
      // For Safari and mobile, prefer redirect method
      if (isSafari || isFirefox || isMobile) {
        console.log('🔥 Using redirect method for Safari/Firefox/Mobile');
        try {
          await signInWithRedirect(auth, provider);
          console.log('🔥 Redirect initiated successfully');
          return;
        } catch (redirectError) {
          console.log('🔥 Redirect failed:', redirectError.code);
          if (isSafari) {
            throw new Error('Google login requires popup permissions. Please enable popups for this site in Safari settings.');
          }
        }
      }
      
      // For Chrome and other browsers, try popup first
      console.log('🔥 Attempting Google login with popup...');
      try {
        const result = await signInWithPopup(auth, provider);
        const firebaseUser = result.user;
        await handleSuccessfulGoogleLogin(firebaseUser);
        setLoading(false);
        return;
      } catch (popupError) {
        console.log('🔥 Popup failed:', popupError.code);
        
        // If popup was blocked, try redirect as fallback
        if (popupError.code === 'auth/popup-blocked' || popupError.code === 'auth/popup-closed-by-user') {
          console.log('🔥 Popup blocked, trying redirect fallback...');
          try {
            await signInWithRedirect(auth, provider);
            return;
          } catch (redirectError) {
            console.log('🔥 Both popup and redirect failed');
            throw redirectError;
          }
        }
        
        throw popupError;
      }

    } catch (error) {
      console.error('🔥 Google login error:', error);
      console.error('- Error code:', error.code);
      console.error('- Error message:', error.message);
      
      // Provide browser-specific error messages
      let errorMessage = error.message || 'Failed to login with Google';
      if (error.code === 'auth/popup-blocked') {
        errorMessage = 'Popup blocked. Please allow popups for this site and try again.';
      } else if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = 'Login cancelled. Please try again.';
      } else if (error.code === 'auth/network-request-failed') {
        errorMessage = 'Network error. Please check your connection and try again.';
      }
      
      toast.error(errorMessage);
      setLoading(false);
      throw error;
    }
  };

  // Handle successful Google login after Firebase auth
  const handleSuccessfulGoogleLogin = async (firebaseUser) => {
    try {
      console.log('🔥 Processing successful Google login for:', firebaseUser.email);
      
      // Use dynamic backend URL selection
      const backendUrl = await getBackendUrl();
      
      apiClient.defaults.baseURL = backendUrl;
      console.log('🔥 Backend URL set for login:', backendUrl);
      
      let response;
      let data;
      
      // Try login first
      try {
        response = await apiClient.post('/api/auth/login', {
          firebaseUid: firebaseUser.uid,
          avatar: firebaseUser.photoURL || '',
          email: firebaseUser.email || '',
        });
        console.log('🔥 Backend login response:', response.data);
        data = response.data;
      } catch (loginError) {
        // If login fails with 404, try registration
        if (loginError.response?.status === 404) {
          console.log('🔥 User not found, attempting registration...');
          response = await apiClient.post('/api/auth/register', {
            firebaseUid: firebaseUser.uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            firstName: firebaseUser.displayName?.split(' ')[0] || '',
            lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
            avatar: firebaseUser.photoURL || '',
          });
          console.log('🔥 Backend registration response:', response.data);
          data = response.data;
        } else {
          throw loginError;
        }
      }

      // Store token and user data in cookies
      setAuthToken(data.token);
      setUserData(data.user);
      
      // Update React state
      setToken(data.token);
      setFirebaseUser(firebaseUser);
      setUser(data.user);
      console.log('📝 User state updated:', data.user);
      console.log('🔑 Token stored in cookies:', data.token ? 'Yes' : 'No');
      
      // If user has no username, show modal
      if (!data.user.username) {
        setPendingGoogleUser({ firebaseUser, token: data.token });
        setShowUsernameModal(true);
      } else {
        // Fetch the latest user profile (which will have the username if set)
        console.log('🔥 Fetching user profile after successful login...');
        await fetchUserProfile(data.token);
        console.log('🔥 User profile fetched successfully');
      }
      
      toast.success('Welcome back!');
      setLoading(false);
      return data;
    } catch (error) {
      console.error('Error in handleSuccessfulGoogleLogin:', error);
      toast.error(`Failed to complete Google login: ${error.message}`);
      setLoading(false);
      throw error;
    }
  };

  // Handler for setting username from modal
  const handleSetGoogleUsername = async (username) => {
    console.log('🎯 handleSetGoogleUsername called with:', username);
    console.log('🎯 pendingGoogleUser:', pendingGoogleUser);
    console.log('🎯 current user:', user);
    console.log('🎯 current token:', token);
    
    try {
      setLoading(true);
      console.log('🔄 Setting username:', username);
      
      // Use current token if no pending user (for already logged in users)
      const userToken = pendingGoogleUser?.token || token;
      console.log('🔄 Using token:', userToken ? 'Present' : 'Missing');
      
      if (!userToken) {
        throw new Error('No authentication token available');
      }
      
      const res = await apiClient.post('/api/users/set-username', { username });
      console.log('✅ Username set response:', res.data);
      
      // Update user state and cookies
      setUser(res.data.user);
      setUserData(res.data.user);
      
      // Clear modal state if it was from pending Google user
      if (pendingGoogleUser) {
        setShowUsernameModal(false);
        setPendingGoogleUser(null);
        
        toast.success('Username set successfully!');
        console.log('🎯 Navigating to dashboard in 150ms...');
        setTimeout(() => {
          console.log('🎯 Executing navigation to /dashboard');
          navigate('/dashboard');
        }, 150);
      } else {
        // For already logged in users, just show success
        toast.success('Username updated successfully!');
      }
    } catch (err) {
      console.error('❌ Set username error:', err);
      console.error('❌ Error details:', err.response?.data);
      toast.error(err.response?.data?.message || 'Failed to set username');
    } finally {
      setLoading(false);
    }
  };

  // Logout
  const logout = async () => {
    try {
      setLoading(true);
      clearAutoLogoutTimer();
      
      // Sign out from Firebase if user is logged in with Firebase
      if (firebaseUser) {
        await signOut(auth);
      }
      
      // Clear cookies to avoid stale auth state across reloads
      clearAuthCookies();

      // Clear local state and global state
      setUser(null);
      setFirebaseUser(null);
      setToken(null);
      
      // Reset global auth state
      globalAuthState.user = null;
      globalAuthState.token = null;
      globalAuthState.firebaseUser = null;
      globalAuthState.loading = false;
      authInitialized = false; // Allow re-initialization after logout
      
      toast.success('Logged out successfully');
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    } finally {
      setLoading(false);
    }
  };

  // Verify token
  const verifyToken = async (token) => {
    try {
      console.log('🔍 Verifying token:', token ? 'Token exists' : 'No token');
      
      // Use dynamic backend URL selection
      const backendUrl = await getBackendUrl();
      
      apiClient.defaults.baseURL = backendUrl;
      
      const response = await apiClient.get('/api/auth/verify', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      console.log('📊 Token verification response status:', response.status);
      console.log('✅ Token verification successful, user:', response.data.user);
      setUser(response.data.user);
      return true;
    } catch (error) {
      console.error('❌ Token verification error:', error);
      return false;
    }
  };

  // After login or signup, fetch the latest user profile
  const fetchUserProfile = async (token) => {
    try {
      console.log(' Fetching user profile with token:', token ? 'Token exists' : 'No token');
      // Import apiClient dynamically to avoid circular dependency
      const { default: apiClient } = await import('../utils/apiClient');
      const res = await apiClient.get('/api/users/profile');
      console.log(' User profile data received:', res.data);
      setUser(res.data);
    } catch (err) {
      console.error('Failed to fetch user profile after login:', err);
    }
  };

  // In your login and signup handlers, after saving the token:
  // Example for Google login:
  const handleGoogleLogin = async (user) => {
    // ... existing code ...
    localStorage.setItem('token', token);
    setToken(token);
    fetchUserProfile(token); // <-- fetch latest user info
    // ... existing code ...
  };

  // Example for email/password login/signup:
  const handleEmailLogin = async (user) => {
    // ... existing code ...
    localStorage.setItem('token', token);
    setToken(token);
    fetchUserProfile(token); // <-- fetch latest user info
    // ... existing code ...
  };

  // Check for stored token on app load
  useEffect(() => {
    const initializeAuth = async () => {
      // Global singleton check - only initialize once across all AuthProvider instances
      if (authInitialized) {
        console.log(`🔒 Instance #${currentInstance}: Auth already initialized globally, syncing state`);
        setUser(globalAuthState.user);
        setToken(globalAuthState.token);
        setFirebaseUser(globalAuthState.firebaseUser);
        setLoading(globalAuthState.loading);
        return;
      }
      
      // Check if another instance is already initializing
      if (authInitializing) {
        console.log(`⏳ Instance #${currentInstance}: Auth initialization in progress by another instance, waiting...`);
        // Wait for initialization to complete, then sync state
        const checkInterval = setInterval(() => {
          if (authInitialized) {
            clearInterval(checkInterval);
            console.log(`✅ Instance #${currentInstance}: Syncing to completed auth state`);
            setUser(globalAuthState.user);
            setToken(globalAuthState.token);
            setFirebaseUser(globalAuthState.firebaseUser);
            setLoading(globalAuthState.loading);
          }
        }, 100);
        return;
      }
      
      // Prevent multiple initialization attempts (check first)
      if (initializingRef.current) {
        console.log(`🔒 Instance #${currentInstance}: Auth initialization already in progress locally, skipping`);
        return;
      }
      
      initializingRef.current = true;
      authInitializing = true;
      setAuthLoading(true);
      console.log(`🚀 Instance #${currentInstance}: Starting auth initialization (singleton)`);

      // Ensure backend is switched and base URL is set
      try {
        // Use dynamic backend URL selection
        const backendUrl = await getBackendUrl();
        
        apiClient.defaults.baseURL = backendUrl;
        console.log(`🌐 Backend base URL set to: ${backendUrl}`);
      } catch (error) {
        console.error('❌ Failed to switch backend:', error);
        toast.error('Failed to connect to backend. Please try again later.');
        setAuthLoading(false);
        initializingRef.current = false; // Reset flag on error
        return;
      }
      let userSet = false;
      
      try {
        // Check if cookies are enabled
        if (!areCookiesEnabled()) {
          console.error(' Cookies are disabled. Authentication requires cookies.');
          toast.error('Please enable cookies to use authentication features.');
          setLoading(false);
          return;
        }

        // Check for stored token in cookies
        const storedToken = getAuthToken();
        console.log(' Auth initialization - Token found:', storedToken ? 'Yes' : 'No');
        
        if (storedToken) {
          // Check if token is expired before making API call
          const decoded = decodeJwt(storedToken);
          const isExpired = decoded && decoded.exp && decoded.exp * 1000 <= Date.now();
          
          console.log(' Token expiry check:', isExpired ? 'Expired' : 'Valid');
          
          if (!isExpired) {
            // Skip token verification for now - just restore from cookies
            setToken(storedToken);
            const savedUser = getUserData();
            if (savedUser) {
              setUser(savedUser);
              console.log(' User data restored from cookie');
              userSet = true;
              setLoading(false); // Set loading false when user is restored
            } else {
              // If no saved user data, try to verify token
              const isValid = await verifyToken(storedToken);
              console.log(' Token verification result:', isValid);
              if (isValid) {
                userSet = true;
                setLoading(false);
              } else {
                clearAuthCookies();
                setUser(null);
                setToken(null);
              }
            }
          } else {
            console.log(' Token expired, clearing');
            clearAuthCookies();
            setUser(null);
            setToken(null);
          }
        } else {
          setUser(null);
          setToken(null);
        }

        // Handle Firebase redirect result
        const handleRedirectResult = async () => {
          try {
            console.log('Checking for redirect result...');
            console.log('Auth state:', auth ? 'Auth initialized' : 'Auth not initialized');
            
            if (!auth) {
              console.log('Auth not initialized, skipping redirect check');
              return;
            }
            
            const result = await getRedirectResult(auth);
            if (result && result.user) {
              console.log('Redirect result received:', result.user.email);
              console.log('User UID:', result.user.uid);
              console.log('User display name:', result.user.displayName);
              console.log('User photo URL:', result.user.photoURL);
              
              // Process the successful Google login
              const loginData = await handleSuccessfulGoogleLogin(result.user);
              
              if (loginData && loginData.token) {
                console.log('Google login successful, setting user state');
                
                // Set the user and token immediately
                setUser(loginData.user);
                setToken(loginData.token);
                // Cookies will be set automatically by useEffect hooks
                
                userSet = true;
                setLoading(false);
                
                // Navigate to dashboard after successful login
                setTimeout(() => {
                  console.log('Navigating to dashboard');
                  window.location.href = '/dashboard';
                }, 500);
              } else {
                console.error('Login data incomplete:', loginData);
                setLoading(false);
              }
            } else {
              console.log('No redirect result found');
              setLoading(false);
            }
          } catch (error) {
            console.error('Error handling redirect result:', error.code, error.message);
            setLoading(false);
            setUser(null);
            setToken(null);
            clearAuthCookies();
            
            // Show user-friendly error message
            if (error.code === 'auth/popup-closed-by-user') {
              toast.error('Login cancelled by user');
            } else if (error.code === 'auth/network-request-failed') {
              toast.error('Network error. Please check your connection.');
            } else {
              toast.error('Google login failed. Please try again.');
            }
            
            // Clear any stale redirect state
            try {
              await getRedirectResult(auth);
            } catch (clearError) {
              console.log('Clearing redirect result:', clearError);
            }
          }
        };

        await handleRedirectResult();
      } catch (error) {
        console.error('Auth initialization error:', error);
        setUser(null);
      } finally {
        initializingRef.current = false; // Reset flag
        authInitializing = false; // Reset global initializing flag
        authInitialized = true; // Mark as initialized
        setAuthLoading(false); // Always reset auth loading
        // Only set loading to false if we haven't set a user
        if (!userSet) {
          setLoading(false);
          globalAuthState.loading = false;
        }
        hasInitializedRef.current = true; // Mark this instance as initialized
        console.log(`✅ Instance #${currentInstance}: Auth initialization complete`);
      }
    };

    initializeAuth();
  }, []);

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setFirebaseUser(firebaseUser);
      globalAuthState.firebaseUser = firebaseUser;
    });

    return unsubscribe;
  }, []);

  // Listen for global auth token refresh/failure events from apiClient
  useEffect(() => {
    const handleTokenRefreshed = (e) => {
      const newToken = e?.detail?.token;
      if (newToken) {
        setToken(newToken);
        // Reschedule auto-logout based on new token expiry
        scheduleAutoLogout(newToken);
      }
    };

    const handleRefreshFailed = () => {
      // Clear local state and cookies; user must log in again
      clearAuthCookies();
      setUser(null);
      setToken(null);
      try { toast.error('Your session expired. Please log in again.'); } catch (_) {}
    };

    window.addEventListener('auth:tokenRefreshed', handleTokenRefreshed);
    window.addEventListener('auth:refreshFailed', handleRefreshFailed);

    return () => {
      window.removeEventListener('auth:tokenRefreshed', handleTokenRefreshed);
      window.removeEventListener('auth:refreshFailed', handleRefreshFailed);
    };
  }, []);

  // Store token in secure cookies when it changes
  useEffect(() => {
    globalAuthState.token = token;
    if (token) {
      const currentStoredToken = getAuthToken();
      if (currentStoredToken !== token) {
        setAuthToken(token);
        console.log('🍪 Token saved to secure cookie');
      }
      scheduleAutoLogout(token);
    } else if (hasInitializedRef.current) {
      // Only remove cookies if this instance has completed initialization
      const currentStoredToken = getAuthToken();
      if (currentStoredToken) {
        removeAuthToken();
        console.log('🗑️ Token removed from cookie');
      }
      clearAutoLogoutTimer();
    }
  }, [token]);

  // Store user data in cookies when it changes
  useEffect(() => {
    globalAuthState.user = user;
    if (user) {
      setUserData(user);
      console.log('🍪 User data saved to cookie');
    } else if (hasInitializedRef.current) {
      // Only remove user data if this instance has completed initialization
      removeUserData();
    }
  }, [user]);

  // Sync loading state to global state
  useEffect(() => {
    globalAuthState.loading = loading;
  }, [loading]);

  // Sync firebaseUser to global state
  useEffect(() => {
    globalAuthState.firebaseUser = firebaseUser;
  }, [firebaseUser]);

  // Add this useEffect to check for missing username after user is set
  useEffect(() => {
    if (user && !user.username) {
      setShowUsernameModal(true);
    } else {
      setShowUsernameModal(false);
    }
  }, [user]);

  const initializeAchievements = async (userId) => {
    try {
      const response = await fetch(`${getApiUrl()}/api/achievements/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
        }),
      });
      return response.data;
    } catch (error) {
      console.error('Failed to initialize achievements:', error);
      throw error;
    }
  };

  const value = {
    user,
    firebaseUser,
    loading,
    token,
    awaitingEmailVerification,
    showUsernameModal,
    pendingGoogleUser,
    getFirebaseToken,
    register,
    finalizeEmailRegistration,
    registerTraditional,
    login,
    loginTraditional,
    loginWithGoogle,
    logout,
    verifyToken,
    resendVerificationEmail,
    verifyOTP,
    handleSetGoogleUsername,
    initializeAchievements,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 
