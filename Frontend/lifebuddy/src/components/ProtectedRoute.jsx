import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePremium } from '../context/PremiumContext';

const ProtectedRoute = ({ children, roles = ['premium', 'admin'], inlineFallback = null }) => {
  const { user, loading: authLoading } = useAuth();
  const { isPremium, loading: premiumLoading } = usePremium();

  // Avoid redirects until we know auth/subscription state
  if (authLoading || premiumLoading) return null;

  // Check if user is logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Admin detection aligned with backend (email-based)
  const adminEmailsEnv = import.meta.env.VITE_ADMIN_EMAILS || 'rohit367673@gmail.com';
  const adminEmails = adminEmailsEnv
    .split(',')
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  const isAdmin = !!(user?.email && adminEmails.includes(user.email.toLowerCase()));

  // Determine user role and enforce access
  const userRole = isPremium ? 'premium' : 'free';

  if (!roles.includes(userRole) && !isAdmin) {
    // User is not premium and not admin
    if (inlineFallback) return inlineFallback;
    return <Navigate to="/premium" replace />;
  }

  return children;
};

export default ProtectedRoute;
