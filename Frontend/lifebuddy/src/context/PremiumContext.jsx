import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

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
      }
    } catch (error) {
      console.error('Error fetching subscription status:', error);
    } finally {
      setLoading(false);
    }
  };

  // Start free trial
  const startTrial = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/subscriptions/trial`, {
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

  // Subscribe to premium plan
  const subscribe = async (plan) => {
    try {
      // In a real app, you'd integrate with Stripe here
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/subscriptions/subscribe`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          plan,
          stripeCustomerId: 'mock_customer_id',
          stripeSubscriptionId: 'mock_subscription_id'
        })
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

  // Check if user has premium feature
  const hasFeature = (feature) => {
    return features[feature] || false;
  };

  // Check usage limits
  const checkUsageLimit = (limitType) => {
    const limits = {
      activeEvents: { free: 2, current: usage.activeEvents || 0 },
      dailyTasks: { free: 10, current: usage.dailyTasks || 0 },
      moodEntries: { free: 7, current: usage.moodEntries || 0 }
    };

    const limit = limits[limitType];
    return {
      current: limit.current,
      limit: limit.free,
      isLimited: subscription?.plan === 'free' && limit.current >= limit.free,
      remaining: limit.free - limit.current
    };
  };

  // Show upgrade prompt
  const showUpgradePrompt = (feature, message = 'Upgrade to premium for unlimited access') => {
    toast.error(message, {
      duration: 5000,
      action: {
        label: 'Upgrade',
        onClick: () => window.location.href = '/premium'
      }
    });
  };

  // Get subscription plans
  const getPlans = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/subscriptions/plans`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error fetching plans:', error);
    }
    return [];
  };

  useEffect(() => {
    if (user && token) {
      fetchSubscriptionStatus();
    }
  }, [user, token]);

  const value = {
    subscription,
    features,
    usage,
    loading,
    hasFeature,
    checkUsageLimit,
    startTrial,
    subscribe,
    showUpgradePrompt,
    getPlans,
    fetchSubscriptionStatus
  };

  return (
    <PremiumContext.Provider value={value}>
      {children}
    </PremiumContext.Provider>
  );
}; 