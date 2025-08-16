import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../utils/config';

/**
 * PremiumCheck component to restrict access to premium features
 * Shows a locked page message with upgrade instructions for non-premium users
 */
export default function PremiumCheck({ children }) {
  const { user, token, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false);
  const [freeTrialAvailable, setFreeTrialAvailable] = useState(false);
  const [freeTrialRequirements, setFreeTrialRequirements] = useState({
    watchedAd: false,
    followedInstagram: false,
    sharedWithFriends: false
  });
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated && !loading) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }

    // Check premium status
    const checkPremiumAccess = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${getApiUrl()}/api/user/premium-status`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (response.ok) {
          const data = await response.json();
          setHasPremiumAccess(data.hasPremiumAccess);
          setFreeTrialAvailable(data.freeTrialAvailable);
          setFreeTrialRequirements(data.freeTrialRequirements || {
            watchedAd: false,
            followedInstagram: false,
            sharedWithFriends: false
          });
        } else {
          // If API fails, fallback to client-side check
          const isPremium = user?.subscription?.status === 'active' && 
                          ['monthly', 'yearly'].includes(user?.subscription?.plan);
          const hasActiveTrial = user?.freeTrial?.isActive && 
                               new Date(user?.freeTrial?.endDate) > new Date();
          setHasPremiumAccess(isPremium || hasActiveTrial);
        }
      } catch (error) {
        console.error('Error checking premium status:', error);
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated && token) {
      checkPremiumAccess();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, token, user, navigate]);

  // Handle free trial requirement completion
  const completeTrialRequirement = async (requirement) => {
    try {
      const response = await fetch(`${getApiUrl()}/api/user/complete-trial-requirement`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ requirement })
      });

      if (response.ok) {
        const data = await response.json();
        setFreeTrialRequirements(data.requirements);
        
        // Check if all requirements are completed
        if (Object.values(data.requirements).every(val => val)) {
          setHasPremiumAccess(true);
        }
      }
    } catch (error) {
      console.error('Error completing trial requirement:', error);
    }
  };

  // Watch ad requirement
  const handleWatchAd = async () => {
    // Simulate watching an ad
    alert('Ad would play here in production. Marking as completed.');
    await completeTrialRequirement('watchedAd');
  };

  // Follow Instagram requirement
  const handleFollowInstagram = async () => {
    window.open('https://www.instagram.com/Rohitkumar324', '_blank');
    await completeTrialRequirement('followedInstagram');
  };

  // Share with friends requirement
  const handleShareWithFriends = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'LifeBuddy AI',
          text: 'Check out LifeBuddy AI, the personal productivity assistant by Rohit Kumar!',
          url: window.location.origin,
        });
        await completeTrialRequirement('sharedWithFriends');
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      // Fallback for browsers that don't support navigator.share
      const shareText = 'Check out LifeBuddy AI, the personal productivity assistant by Rohit Kumar! ' + window.location.origin;
      const shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
      window.open(shareUrl, '_blank');
      await completeTrialRequirement('sharedWithFriends');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!hasPremiumAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-900 to-indigo-900 text-white p-4">
        <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-xl p-8 shadow-2xl border border-white/20">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-2">Premium Feature</h2>
            <div className="w-16 h-16 mx-auto mb-4 bg-amber-500 rounded-full flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <p className="mb-6 text-white/80">
              This feature is available exclusively for premium users. Upgrade your account to access LifeBuddy AI's advanced capabilities.
            </p>
            
            {freeTrialAvailable && (
              <div className="mb-6 bg-white/10 rounded-lg p-4 text-left">
                <h3 className="font-semibold text-lg mb-2">Get 1 Week Free Trial</h3>
                <p className="text-sm mb-4 text-white/80">Complete these tasks to unlock premium features for 7 days:</p>
                
                <div className="space-y-3">
                  <button 
                    onClick={handleWatchAd}
                    disabled={freeTrialRequirements.watchedAd}
                    className={`w-full py-2 px-4 rounded flex items-center justify-between ${freeTrialRequirements.watchedAd ? 'bg-green-500/20 text-green-100' : 'bg-white/20 hover:bg-white/30'}`}
                  >
                    <span>Watch an ad</span>
                    {freeTrialRequirements.watchedAd && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                  
                  <button 
                    onClick={handleFollowInstagram}
                    disabled={freeTrialRequirements.followedInstagram}
                    className={`w-full py-2 px-4 rounded flex items-center justify-between ${freeTrialRequirements.followedInstagram ? 'bg-green-500/20 text-green-100' : 'bg-white/20 hover:bg-white/30'}`}
                  >
                    <span>Follow @Rohitkumar324 on Instagram</span>
                    {freeTrialRequirements.followedInstagram && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                  
                  <button 
                    onClick={handleShareWithFriends}
                    disabled={freeTrialRequirements.sharedWithFriends}
                    className={`w-full py-2 px-4 rounded flex items-center justify-between ${freeTrialRequirements.sharedWithFriends ? 'bg-green-500/20 text-green-100' : 'bg-white/20 hover:bg-white/30'}`}
                  >
                    <span>Share with friends</span>
                    {freeTrialRequirements.sharedWithFriends && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
              </div>
            )}
            
            <a 
              href="/pricing" 
              className="block w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              Upgrade Now
            </a>
          </div>
        </div>
      </div>
    );
  }

  // User has premium access, show the children components
  return children;
}