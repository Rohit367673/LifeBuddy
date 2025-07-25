import { createContext, useContext, useEffect, useState } from 'react';
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
      
      // Register user directly in backend
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/auth/register-traditional`, {
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
        throw new Error(errorData.message || 'Failed to register user');
      }

      const data = await response.json();
      setToken(data.token);
      setUser(data.user);
      
      toast.success('Account created successfully!');
      return data;
    } catch (error) {
      console.error('Traditional registration error:', error);
      toast.error(error.message || 'Failed to create account');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Traditional login (without Firebase)
  const loginTraditional = async (email, password) => {
    try {
      setLoading(true);
      
      // Login directly to backend
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/auth/login-traditional`, {
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
        throw new Error(errorData.message || 'Failed to login');
      }

      const data = await response.json();
      setToken(data.token);
      setUser(data.user);
      
      toast.success('Welcome back!');
      return data;
    } catch (error) {
      console.error('Traditional login error:', error);
      toast.error(error.message || 'Failed to login');
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
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/auth/register`, {
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
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/auth/login`, {
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
      
      const provider = new GoogleAuthProvider();
      provider.addScope('email');
      provider.addScope('profile');
      
      // Set custom parameters for better UX
      provider.setCustomParameters({
        prompt: 'select_account'
      });
      
      console.log('Starting Google login...');
      console.log('Current auth state:', auth.currentUser);
      
      // Try popup first, fallback to redirect
      try {
        console.log('Attempting popup login...');
        const result = await signInWithPopup(auth, provider);
        console.log('Popup login successful:', result.user.email);
        
        // Handle successful popup login
        const firebaseUser = result.user;
        await handleSuccessfulGoogleLogin(firebaseUser);
        
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
      // Try to login to backend, if user doesn't exist, register them
      let response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firebaseUid: firebaseUser.uid,
          avatar: firebaseUser.photoURL, // Always send avatar
        }),
      });

      if (response.status === 404) {
        // User not found, register them
        response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/auth/register`, {
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
        if (response.status === 409) {
          // User already exists, try login again
          response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/auth/login`, {
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
        const errorText = await response.text();
        throw new Error('Failed to authenticate with backend: ' + errorText);
      }

      const data = await response.json();
      setToken(data.token);
      setFirebaseUser(firebaseUser);
      setUser(data.user); // Set user immediately for fast UI feedback
      // Fetch the latest user profile (which will have the username if set)
      await fetchUserProfile(data.token);
      // setUser(data.user); // Remove this line, as fetchUserProfile sets the user
      // If user has no username, show modal
      if (!data.user.username) {
        setPendingGoogleUser({ firebaseUser, token: data.token });
        setShowUsernameModal(true);
        return;
      }
      toast.success('Welcome to LifeBuddy!');
      setTimeout(() => {
        navigate('/dashboard');
      }, 150);
    } catch (error) {
      toast.error('Failed to complete Google login');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Handler for setting username from modal
  const handleSetGoogleUsername = async (username) => {
    if (!pendingGoogleUser) return;
    try {
      setLoading(true);
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/users/set-username`, {
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
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/auth/verify`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
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
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/users/profile`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data);
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
            const result = await getRedirectResult(auth);
            if (result) {
              console.log('Redirect result received:', result.user.email);
              await handleSuccessfulGoogleLogin(result.user);
              userSet = true;
            }
          } catch (error) {
            console.error('Error handling redirect result:', error);
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
    } else {
      localStorage.removeItem('token');
      console.log('Token removed from localStorage');
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