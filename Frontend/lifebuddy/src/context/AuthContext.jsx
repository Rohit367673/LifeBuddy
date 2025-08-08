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
  signInWithPopup
} from 'firebase/auth';
import { auth } from '../utils/firebaseConfig';
import { getApiUrl, logConfig } from '../utils/config';
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
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [pendingGoogleUser, setPendingGoogleUser] = useState(null);
  const tokenExpiryTimeoutRef = useRef(null);
  const navigate = useNavigate();

  // Get authentication token (ALWAYS use backend JWT, never Google ID token)
  const getFirebaseToken = async () => {
    // Always return the backend-issued JWT token
    return token;
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

  // Register user with Firebase and backend
  const register = async (email, password, displayName) => {
    try {
      setLoading(true);
      
      // Use real Firebase authentication
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const firebaseUser = userCredential.user;
      
      // Update profile with display name
      await updateProfile(firebaseUser, { displayName });
      
      // Get Firebase token
      const firebaseToken = await firebaseUser.getIdToken();
      
      // Register user in backend
      const response = await fetch(`${getApiUrl()}/api/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: displayName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to register user in backend');
      }

      const data = await response.json();
      setToken(data.token);
      setFirebaseUser(firebaseUser);
      setUser(data.user); // Set user immediately for fast UI feedback
      fetchUserProfile(data.token); // Update with latest info in background
      console.log('AuthContext: user set after login/register:', data.user);
      console.log('AuthContext: firebaseUser set after login/register:', firebaseUser);
      
      toast.success('Account created successfully!');
      return data;
    } catch (error) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Failed to create account');
      throw error;
    } finally {
      setLoading(false);
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
      
      // Check if we're in a mobile browser (Instagram, Facebook, etc.)
      const isMobileBrowser = /Instagram|FBAN|FBAV|Facebook|Line|Twitter|LinkedInApp|WhatsApp|TelegramWebApp/i.test(navigator.userAgent);
      
      if (isMobileBrowser) {
        console.log('Detected mobile browser, using redirect method');
        // Clear any existing redirect result first
        try {
          await getRedirectResult(auth);
        } catch (error) {
          console.log('Clearing existing redirect result:', error);
        }
        
        await signInWithRedirect(auth, provider);
        // The redirect will happen here, and the result will be handled in useEffect
        return;
      }
      
      // Try popup first, fallback to redirect for desktop
      try {
        console.log('Attempting popup login...');
        const result = await signInWithPopup(auth, provider);
        console.log('Popup login successful:', result.user.email);
        
        // Handle successful popup login
        const firebaseUser = result.user;
        await handleSuccessfulGoogleLogin(firebaseUser);
        setLoading(false);
        
      } catch (popupError) {
        console.log('Popup failed, trying redirect:', popupError);
        
        // Clear any existing redirect result first
        try {
          await getRedirectResult(auth);
        } catch (error) {
          console.log('Clearing existing redirect result:', error);
        }
        
        await signInWithRedirect(auth, provider);
        // The redirect will happen here, and the result will be handled in useEffect
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
      
      const apiUrl = getApiUrl();
      console.log('Using API URL:', apiUrl);
      
      // Try to login to backend, if user doesn't exist, register them
      let response = await fetch(`${apiUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: firebaseUser.uid,
          avatar: firebaseUser.photoURL, // Always send avatar
        }),
      });

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
      let userSet = false;
      try {
        // Check for stored token
        const storedToken = localStorage.getItem('token');
        console.log('Token found in localStorage on app load:', storedToken);
        if (storedToken) {
          const isValid = await verifyToken(storedToken);
          console.log('Token valid?', isValid);
          if (isValid) {
            setToken(storedToken);
            userSet = true;
          } else {
            localStorage.removeItem('token');
            setUser(null);
          }
        } else {
          setUser(null);
        }

        // Handle Firebase redirect result
        const handleRedirectResult = async () => {
          try {
            console.log('Checking for redirect result...');
            const result = await getRedirectResult(auth);
            if (result) {
              console.log('Redirect result received:', result.user.email);
              await handleSuccessfulGoogleLogin(result.user);
              userSet = true;
            } else {
              console.log('No redirect result found');
            }
          } catch (error) {
            console.error('Error handling redirect result:', error);
            // Don't let redirect errors break the auth flow
            setUser(null);
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

  // Store token in localStorage when it changes
  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token);
      console.log('Token saved to localStorage:', token);
      scheduleAutoLogout(token);
    } else {
      localStorage.removeItem('token');
      console.log('Token removed from localStorage');
      clearAutoLogoutTimer();
    }
  }, [token]);

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
    getFirebaseToken,
    register,
    registerTraditional,
    login,
    loginTraditional,
    loginWithGoogle,
    logout,
    verifyToken,
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