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

const AuthContext = createContext();

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
  const [user, setUser] = useState(null);
  const [firebaseUser, setFirebaseUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [awaitingEmailVerification, setAwaitingEmailVerification] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [pendingGoogleUser, setPendingGoogleUser] = useState(null);
  const tokenExpiryTimeoutRef = useRef(null);
  const initializingRef = useRef(false);
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
      const fu = auth.currentUser;
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
      const fu = auth.currentUser;
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
      setLoading(true);
      
      // Fast fail if Firebase isn't initialized (common cause of Google login issues)
      if (!auth) {
        const hint =
          'Google login not configured. Please set VITE_FIREBASE_* values in Frontend/lifebuddy/.env (or .env.local), enable Google provider in Firebase Auth, and restart the dev server.';
        console.error('Google login blocked: Firebase auth is null. ' + hint);
        toast.error('Google login is not configured. Please update your Firebase .env settings.');
        setLoading(false);
        return;
      }

      // Log configuration for debugging
      logConfig();
      
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      // Set custom parameters for better UX
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      console.log('Starting Google login...');
      console.log('Current auth state:', auth.currentUser);
      console.log('API URL:', getApiUrl());
      console.log('Auth domain:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
      

      // Try popup first, fallback to redirect if popup fails
      console.log('Attempting popup login first...');
      
      try {
        const result = await signInWithPopup(auth, provider);
        console.log('Popup login successful:', result.user.email);
        const firebaseUser = result.user;
        await handleSuccessfulGoogleLogin(firebaseUser);
        setLoading(false);
        return;
      } catch (popupError) {
        console.log('Popup failed, trying redirect method:', popupError.code);
        
        // If popup fails, use redirect method
        console.log('Using redirect method for Google login');
        setAuthLoading(true);
        
        // Clear any existing redirect result first
        try {
          await getRedirectResult(auth);
        } catch (error) {
          console.log('Clearing existing redirect result:', error);
        }
        
        // Use redirect method as fallback
        await signInWithRedirect(auth, provider);
        return;
      }

    } catch (error) {
      console.error('Google login error:', error);
      toast.error(error.message || 'Failed to login with Google');
      setLoading(false);
      throw error;
    }
  };

  // Handle successful Google login (extracted for reuse)
  const handleSuccessfulGoogleLogin = async (firebaseUser) => {
    try {
      console.log('Handling successful Google login for:', firebaseUser.email);
      console.log('Firebase UID:', firebaseUser.uid);
      console.log('Firebase display name:', firebaseUser.displayName);
      console.log('Firebase photo URL:', firebaseUser.photoURL);
      
      // Get Firebase token for debugging
      let idToken = '';
      try {
        idToken = await firebaseUser.getIdToken(true);
        console.log('Firebase ID token obtained successfully, length:', idToken.length);
        console.log('First 10 chars of token:', idToken.substring(0, 10) + '...');
      } catch (tokenError) {
        console.error('Error getting Firebase ID token:', tokenError);
      }
      
      const apiUrl = getApiUrl();
      console.log('Using API URL:', apiUrl);
      
      // Try to login to backend, if user doesn't exist, register them
      console.log('Attempting backend login with Firebase UID:', firebaseUser.uid);
      console.log('User email:', firebaseUser.email);
      let response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: firebaseUser.uid,
          avatar: firebaseUser.photoURL || '', // Always send avatar, default to empty string
          email: firebaseUser.email || '', // Send email as backup
        }),
      });
      console.log('Backend login attempt complete');

      console.log('Login response status:', response.status);

      if (response.status === 404) {
        // User not found, register them
        console.log('User not found, registering...');
        response = await fetch(`${apiUrl}/api/auth/register`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            firebaseUid: firebaseUser.uid,
            email: firebaseUser.email,
            displayName: firebaseUser.displayName || firebaseUser.email.split('@')[0],
            firstName: firebaseUser.displayName?.split(' ')[0] || '',
            lastName: firebaseUser.displayName?.split(' ').slice(1).join(' ') || '',
            avatar: firebaseUser.photoURL,
          }),
        });
        
        console.log('Register response status:', response.status);
        
        if (response.status === 409) {
          // User already exists, try login again
          console.log('User already exists, trying login again...');
          response = await fetch(`${apiUrl}/api/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              firebaseUid: firebaseUser.uid,
              avatar: firebaseUser.photoURL,
            }),
          });
        }
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('Backend request failed:', response.status, errorData);
        throw new Error(`Backend request failed: ${response.status} - ${errorData.message || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('Backend response:', data);
      
      setToken(data.token);
      setFirebaseUser(firebaseUser);
      setUser(data.user); // Set user immediately for fast UI feedback
      console.log('✅ User state updated:', data.user);
      console.log('✅ Token set:', data.token);
      
      // If user has no username, show modal
      if (!data.user.username) {
        setPendingGoogleUser({ firebaseUser, token: data.token });
        setShowUsernameModal(true);
      } else {
        // Fetch the latest user profile (which will have the username if set)
        console.log('🔍 Fetching user profile after successful login...');
        await fetchUserProfile(data.token);
        console.log('✅ User profile fetched successfully');
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
    if (!pendingGoogleUser) return;
    try {
      setLoading(true);
      const res = await fetch(`${getApiUrl()}/api/users/set-username`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${pendingGoogleUser.token}`
        },
        body: JSON.stringify({ username })
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.message || 'Failed to set username');
        return;
      }
      setUser(data.user);
      setShowUsernameModal(false);
      setPendingGoogleUser(null);
      toast.success('Username set successfully!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 150);
    } catch (err) {
      toast.error('Failed to set username');
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
      
      // Clear local state
      setUser(null);
      setFirebaseUser(null);
      setToken(null);
      
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
      
      const response = await fetch(`${getApiUrl()}/api/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      console.log('🔍 Token verification response status:', response.status);

      if (!response.ok) {
        console.log('❌ Token verification failed');
        return false;
      }

      const data = await response.json();
      console.log('✅ Token verification successful, user:', data.user);
      setUser(data.user);
      return true;
    } catch (error) {
      console.error('Token verification error:', error);
      return false;
    }
  };

  // After login or signup, fetch the latest user profile
  const fetchUserProfile = async (token) => {
    try {
      console.log('🔍 Fetching user profile with token:', token ? 'Token exists' : 'No token');
      const res = await fetch(`${getApiUrl()}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('🔍 User profile response status:', res.status);
      if (res.ok) {
        const data = await res.json();
        console.log('✅ User profile data received:', data);
        setUser(data);
      } else {
        console.log('❌ User profile fetch failed:', res.status);
      }
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
      // Prevent multiple initialization attempts
      if (initializingRef.current) {
        console.log('🔄 Auth initialization already in progress, skipping');
        return;
      }
      
      initializingRef.current = true;
      let userSet = false;
      
      try {
        // Check if cookies are enabled
        if (!areCookiesEnabled()) {
          console.error('❌ Cookies are disabled. Authentication requires cookies.');
          toast.error('Please enable cookies to use authentication features.');
          setLoading(false);
          return;
        }

        // Check for stored token in cookies
        const storedToken = getAuthToken();
        console.log('🔄 Auth initialization - Token found:', storedToken ? 'Yes' : 'No');
        
        if (storedToken) {
          // Check if token is expired before making API call
          const decoded = decodeJwt(storedToken);
          const isExpired = decoded && decoded.exp && decoded.exp * 1000 <= Date.now();
          
          console.log('🔍 Token expiry check:', isExpired ? 'Expired' : 'Valid');
          
          if (!isExpired) {
            const isValid = await verifyToken(storedToken);
            console.log('✅ Token verification result:', isValid);
            if (isValid) {
              setToken(storedToken);
              // Also restore user data from cookies
              const savedUser = getUserData();
              if (savedUser) {
                setUser(savedUser);
                console.log('🍪 User data restored from cookie');
              }
              userSet = true;
            } else {
              clearAuthCookies();
              setUser(null);
              setToken(null);
            }
          } else {
            console.log('❌ Token expired, clearing');
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
        setLoading(false); // Only after all checks and setUser calls
      }
    };

    initializeAuth();
  }, []);

  // Listen for Firebase auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setFirebaseUser(firebaseUser);
    });

    return unsubscribe;
  }, []);

  // Store token in secure cookies when it changes
  useEffect(() => {
    if (token) {
      const currentStoredToken = getAuthToken();
      if (currentStoredToken !== token) {
        setAuthToken(token);
        console.log('🍪 Token saved to secure cookie');
      }
      scheduleAutoLogout(token);
    } else {
      const currentStoredToken = getAuthToken();
      if (currentStoredToken) {
        removeAuthToken();
        console.log('🍪 Token removed from cookie');
      }
      clearAutoLogoutTimer();
    }
  }, [token]);

  // Store user data in cookies when it changes
  useEffect(() => {
    if (user) {
      setUserData(user);
      console.log('🍪 User data saved to cookie');
    } else {
      removeUserData();
    }
  }, [user]);

  // Add this useEffect to check for missing username after user is set
  useEffect(() => {
    if (user && !user.username) {
      setShowUsernameModal(true);
    } else {
      setShowUsernameModal(false);
    }
  }, [user]);

  const value = {
    user,
    firebaseUser,
    loading,
    token,
    awaitingEmailVerification,
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
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
      <UsernameModal
        isOpen={showUsernameModal}
        onClose={() => {}}
        onSetUsername={handleSetGoogleUsername}
      />
    </AuthContext.Provider>
  );
}; 
