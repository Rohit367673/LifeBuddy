import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';
import { LockClosedIcon } from '@heroicons/react/24/outline';
import { isAdmin, hasPremiumAccess, canAccessPremiumFeature, getUserAccessLevel } from '../utils/adminUtils';

const PremiumContext = createContext();

export const usePremium = () => {
  const context = useContext(PremiumContext);
  if (!context) {
    throw new Error('usePremium must be used within a PremiumProvider');
  }
  return context;
};

export const PremiumProvider = ({ children }) => {
  const { user, token } = useAuth();
  const [subscription, setSubscription] = useState(null);
  const [features, setFeatures] = useState({});
  const [usage, setUsage] = useState({});
  const [loading, setLoading] = useState(true);
  const [premiumBadge, setPremiumBadge] = useState(false);
  const [badgeGrantedAt, setBadgeGrantedAt] = useState(null);

  // Fetch subscription status
  const fetchSubscriptionStatus = async () => {
    try {
      if (!token) return;

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/subscriptions/status`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSubscription(data);
        setFeatures(data.features || {});
        setUsage(data.usage || {});
        setPremiumBadge(data.premiumBadge || false);
        setBadgeGrantedAt(data.badgeGrantedAt);
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    } finally {
      setLoading(false);
    }
  };

  // Start free trial
  const startTrial = async (options = {}) => {
    try {
      const base = `${import.meta.env.VITE_API_URL || 'http://localhost:5001'}`;
      const qs = options.requireTasks ? '?requireTasks=true' : '';
      const response = await fetch(`${base}/api/subscriptions/trial${qs}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSubscription(prev => ({ ...prev, ...data }));
        setFeatures(data.features);
        // Refresh server state to ensure isPremium flips everywhere
        fetchSubscriptionStatus();
        toast.success('Free trial started! Enjoy premium features for 7 days.');
        return true;
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to start trial');
        return false;
      }
    } catch (error) {
      console.error('Error starting trial:', error);
      toast.error('Failed to start trial');
      return false;
    }
  };

  // Subscribe to premium plan with payment data
  const subscribe = async (plan, paymentData = null) => {
    try {
      const requestBody = {
        plan,
        paymentData: paymentData || {
          method: 'mock',
          transactionId: 'MOCK_' + Date.now(),
          amount: plan === 'monthly' ? 9.99 : 99.99,
          currency: 'USD',
          status: 'completed'
        }
      };
      if (paymentData?.couponCode) {
        requestBody.couponCode = paymentData.couponCode;
      }

      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/subscriptions/subscribe`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (response.ok) {
        const data = await response.json();
        setSubscription(prev => ({ ...prev, ...data }));
        setFeatures(data.features);
        toast.success('Subscription activated successfully!');
        return true;
      } else {
        const error = await response.json();
        toast.error(error.message || 'Failed to subscribe');
        return false;
      }
    } catch (error) {
      console.error('Error subscribing:', error);
      toast.error('Failed to subscribe');
      return false;
    }
  };

  // Check if user has a specific feature
  const hasFeature = (feature) => {
    // Admin users have access to all features
    if (isAdmin(user)) {
      return true;
    }
    
    if (!subscription) return false;
    
    // Free users have limited access
    if (subscription.plan === 'free') {
      const freeFeatures = [
        'basicEvents',
        'basicTasks', 
        'basicMood',
        'communitySupport'
      ];
      return freeFeatures.includes(feature);
    }
    
    // Premium users have all features
    return subscription.plan === 'monthly' || subscription.plan === 'yearly' || subscription.status === 'trial';
  };

  // Derived flag for easy premium checks (monthly/yearly plan or active trial or admin)
  const isPremium = !!(
    isAdmin(user) || (
      subscription && (
        subscription.plan === 'monthly' ||
        subscription.plan === 'yearly' ||
        subscription.status === 'trial'
      )
    )
  );

  // Check usage limits
  const checkUsageLimit = (limitType) => {
    // Admin users have unlimited access
    if (isAdmin(user)) {
      return {
        current: usage[limitType] || 0,
        limit: Infinity,
        percentage: 0,
        isLimitReached: false
      };
    }

    const limits = {
      activeEvents: { free: 2, premium: Infinity },
      dailyTasks: { free: 10, premium: Infinity },
      moodEntries: { free: 7, premium: Infinity },
      templates: { free: 3, premium: Infinity }
    };

    const limit = limits[limitType];
    if (!limit) return { current: 0, limit: Infinity, percentage: 0 };

    const current = usage[limitType] || 0;
    const maxLimit = subscription?.plan === 'free' ? limit.free : limit.premium;
    const percentage = Math.min((current / maxLimit) * 100, 100);

    return {
      current,
      limit: maxLimit,
      percentage,
      isLimitReached: current >= maxLimit
    };
  };

  // Show upgrade prompt for locked features
  const showUpgradePrompt = (feature, message = 'Upgrade to premium for unlimited access') => {
    if (!hasFeature(feature)) {
    toast.error(message, {
      action: {
        label: 'Upgrade',
        onClick: () => window.location.href = '/premium'
      }
    });
      return true;
    }
    return false;
  };

  // Get available plans
  const getPlans = async () => {
    return [
      {
        id: 'free',
        name: 'Free',
        price: 0,
        period: 'forever',
        description: 'Perfect for getting started',
        features: [
          'Up to 2 active events',
          'Basic task management',
          'Simple mood tracking',
          'Community support',
          'Basic templates'
        ],
        limitations: [
          'Limited event templates',
          'No advanced analytics',
          'No AI insights',
          'No premium support'
        ],
        buttonText: 'Current Plan',
        buttonVariant: 'secondary',
        popular: false
      },
      {
        id: 'monthly',
        name: 'Monthly',
        price: 1.99,
        period: 'month',
        description: 'Most popular choice',
        features: [
          'Unlimited events',
          'All premium templates',
          'AI-powered insights',
          'Advanced analytics',
          'Priority support',
          'Export to PDF',
          'Calendar sync',
          'Custom checklists'
        ],
        limitations: [],
        buttonText: 'Start Monthly',
        buttonVariant: 'primary',
        popular: true,
        savings: null
      },
      {
        id: 'yearly',
        name: 'Yearly',
        price: 21.99,
        period: 'year',
        description: 'Best value - save 17%',
        features: [
          'Everything in Monthly',
          'Early access to new features',
          'Exclusive templates',
          'Advanced reporting',
          'Team collaboration',
          'API access',
          'White-label options'
        ],
        limitations: [],
        buttonText: 'Start Yearly',
        buttonVariant: 'primary',
        popular: false,
        savings: 'Save $19.89'
      }
    ];
  };

  // Feature gate component
  const FeatureGate = ({ feature, children, fallback = null, message = 'Upgrade to premium to access this feature' }) => {
    if (!hasFeature(feature)) {
      return fallback || (
        <div className="text-center py-8">
          <div className="text-gray-500 dark:text-gray-400 mb-4">
            <LockClosedIcon className="h-12 w-12 mx-auto mb-2" />
            <p>{message}</p>
          </div>
          <button
            onClick={() => window.location.href = '/premium'}
            className="btn btn-primary"
          >
            Upgrade to Premium
          </button>
        </div>
      );
    }
    return children;
  };

  // Update subscription status when user changes
  useEffect(() => {
    if (user && token) {
      fetchSubscriptionStatus();
    } else {
      setSubscription(null);
      setFeatures({});
      setUsage({});
      setLoading(false);
    }
  }, [user, token]);

  const value = {
    subscription,
    features,
    usage,
    loading,
    isPremium,
    hasFeature,
    checkUsageLimit,
    showUpgradePrompt,
    startTrial,
    subscribe,
    getPlans,
    FeatureGate,
    fetchSubscriptionStatus,
    premiumBadge,
    badgeGrantedAt,
    // Admin utilities
    isAdmin: () => isAdmin(user),
    hasPremiumAccess: () => hasPremiumAccess(user, isPremium),
    canAccessPremiumFeature: (feature) => canAccessPremiumFeature(user, isPremium, feature),
    getUserAccessLevel: () => getUserAccessLevel(user, isPremium)
  };

  return (
    <PremiumContext.Provider value={value}>
      {children}
    </PremiumContext.Provider>
  );
}; 