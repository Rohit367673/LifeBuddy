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
      setUser(data.user);
      
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
      setUser(data.user);
      
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
          console.log('User already exists after registration attempt, retrying login...');
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
        console.error('Failed to authenticate with backend. Response:', response.status, errorText);
        throw new Error('Failed to authenticate with backend');
      }

      const data = await response.json();
      console.log('Google login backend response:', data);
      setToken(data.token);
      setFirebaseUser(firebaseUser);
      setUser(data.user);
      console.log('Token set in state:', data.token);
      setTimeout(() => {
        console.log('Token in localStorage after setToken:', localStorage.getItem('token'));
      }, 500);
      toast.success('Welcome to LifeBuddy!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Google login backend error:', error);
      toast.error('Failed to complete Google login');
      throw error;
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

  // Check for stored token on app load
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Check for stored token
        const storedToken = localStorage.getItem('token');
        console.log('Token found in localStorage on app load:', storedToken);
        if (storedToken) {
          const isValid = await verifyToken(storedToken);
          console.log('Token valid?', isValid);
          if (isValid) {
            setToken(storedToken);
          } else {
            localStorage.removeItem('token');
          }
        }

        // Handle Firebase redirect result
        const handleRedirectResult = async () => {
          try {
            const result = await getRedirectResult(auth);
            if (result) {
              console.log('Redirect result received:', result.user.email);
              await handleSuccessfulGoogleLogin(result.user);
            }
          } catch (error) {
            console.error('Error handling redirect result:', error);
          }
        };

        await handleRedirectResult();
      } catch (error) {
        console.error('Auth initialization error:', error);
      } finally {
        setLoading(false);
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
    </AuthContext.Provider>
  );
}; 