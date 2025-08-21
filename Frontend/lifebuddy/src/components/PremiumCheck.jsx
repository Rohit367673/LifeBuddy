import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePremium } from '../context/PremiumContext';
import { getApiUrl } from '../utils/config';

/**
 * PremiumCheck component to restrict access to premium features
 * Shows a locked page message with upgrade instructions for non-premium users
 */
export default function PremiumCheck({ children }) {
  const { user, token, isAuthenticated } = useAuth();
  const { startTrial } = usePremium();
  const [loading, setLoading] = useState(true);
  const [hasPremiumAccess, setHasPremiumAccess] = useState(false);
  const [freeTrialAvailable, setFreeTrialAvailable] = useState(false);
  const [freeTrialRequirements, setFreeTrialRequirements] = useState({
    watchedAd: false
  });
  const [reward, setReward] = useState({ sessionId: '', status: 'idle' });
  const IS_PROD = import.meta.env.MODE === 'production';
  const navigate = useNavigate();

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!isAuthenticated && !loading) {
      navigate('/login', { state: { from: window.location.pathname } });
      return;
    }

    // Check premium status and trial task progress (align with backend)
    const checkPremiumAccess = async () => {
      try {
        setLoading(true);
        // 1) Subscription status
        const statusRes = await fetch(`${getApiUrl()}/api/subscriptions/status`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        let plan = 'free';
        let status = 'inactive';
        let trialEndDate = null;

        if (statusRes.ok) {
          const s = await statusRes.json();
          plan = s.plan;
          status = s.status;
          trialEndDate = s.trialEndDate;
        }

        const trialActive = status === 'trial' && trialEndDate && new Date(trialEndDate) > new Date();
        const premiumPlan = plan && plan !== 'free';
        setHasPremiumAccess(Boolean(premiumPlan || trialActive));

        // Trial is available for free users (not on active premium or trial)
        setFreeTrialAvailable(plan === 'free' && !trialActive);

        // 2) Trial task progress
        const progressRes = await fetch(`${getApiUrl()}/api/subscriptions/trial-tasks/progress`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (progressRes.ok) {
          const d = await progressRes.json();
          const t = d.trialTasks || {};
          setFreeTrialRequirements({ watchedAd: !!t.watchedAd });
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

  // Load Google Publisher Tag (GPT) for Rewarded Ads in production
  useEffect(() => {
    if (!IS_PROD) return;
    if (window.googletag && window.googletag.apiReady) return;
    window.googletag = window.googletag || { cmd: [] };
    const scriptId = 'gpt-js';
    if (!document.getElementById(scriptId)) {
      const g = document.createElement('script');
      g.id = scriptId;
      g.async = true;
      g.src = 'https://securepubads.g.doubleclick.net/tag/js/gpt.js';
      document.head.appendChild(g);
    }
  }, [IS_PROD]);

  // Handle free trial requirement completion
  const completeTrialRequirement = async (requirement) => {
    try {
      let endpoint = '';
      let options = { method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } };
      if (requirement === 'watchedAd') endpoint = '/api/subscriptions/trial-tasks/watch-ad';

      if (!endpoint) return;
      const response = await fetch(`${getApiUrl()}${endpoint}`, options);
      if (response.ok) {
        const data = await response.json();
        const t = data.trialTasks || {};
        const next = { watchedAd: !!t.watchedAd };
        setFreeTrialRequirements(next);
      }
    } catch (error) {
      console.error('Error completing trial requirement:', error);
    }
  };

  const handleUnlockTrial = async () => {
    const allDone = freeTrialRequirements.watchedAd;
    if (!allDone) return;
    const ok = await startTrial({ requireTasks: true });
    if (ok) {
      setHasPremiumAccess(true);
    }
  };

  // Watch ad requirement
  const handleWatchAd = async () => {
    if (!IS_PROD) {
      // Dev fallback: manual mark
      await completeTrialRequirement('watchedAd');
      return;
    }
    // Production: start rewarded session and poll status
    try {
      setReward({ sessionId: '', status: 'starting' });
      const s = await fetch(`${getApiUrl()}/api/subscriptions/trial-tasks/rewarded/start`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!s.ok) throw new Error('Failed to start rewarded session');
      const { sessionId } = await s.json();
      setReward({ sessionId, status: 'pending' });
      // Show a GPT Rewarded ad and pass sessionId for SSV correlation
      try {
        window.googletag = window.googletag || { cmd: [] };
        window.googletag.cmd.push(() => {
          const adUnitPath = import.meta.env.VITE_GAM_REWARDED_AD_UNIT; // e.g. '/1234567/rewarded_web'
          if (!adUnitPath) {
            console.warn('VITE_GAM_REWARDED_AD_UNIT not set. Skipping GPT rewarded request.');
            return;
          }
          const slot = googletag.defineOutOfPageSlot(adUnitPath, googletag.enums.OutOfPageFormat.REWARDED);
          if (!slot) {
            console.warn('Failed to define rewarded slot');
            return;
          }
          slot.addService(googletag.pubads());
          try { googletag.pubads().setPublisherProvidedId(sessionId); } catch {}
          try { slot.setTargeting('session_id', sessionId); } catch {}
          googletag.pubads().addEventListener('rewardedSlotReady', (event) => {
            try { event.makeRewardedVisible(); } catch {}
          });
          googletag.enableServices();
          googletag.display(slot);
        });
      } catch (e) {
        console.warn('GPT rewarded error', e);
      }
      let attempts = 0;
      const timer = setInterval(async () => {
        attempts += 1;
        try {
          const r = await fetch(`${getApiUrl()}/api/subscriptions/trial-tasks/rewarded/status/${sessionId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (r.ok) {
            const { status } = await r.json();
            if (status === 'rewarded') {
              clearInterval(timer);
              setReward((prev) => ({ ...prev, status: 'rewarded' }));
              setFreeTrialRequirements({ watchedAd: true });
            }
          }
        } catch {}
        if (attempts > 120) {
          clearInterval(timer);
          setReward((prev) => ({ ...prev, status: 'timeout' }));
        }
      }, 2000);
    } catch (e) {
      setReward({ sessionId: '', status: 'error' });
    }
  };

  // Removed Instagram and share requirements

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
                <p className="text-sm mb-4 text-white/80">Watch one ad to unlock premium features for 7 days:</p>
                
                <div className="space-y-3">
                  <button 
                    onClick={handleWatchAd}
                    disabled={freeTrialRequirements.watchedAd || reward.status==='starting' || reward.status==='pending'}
                    className={`w-full py-2 px-4 rounded flex items-center justify-between ${freeTrialRequirements.watchedAd ? 'bg-green-500/20 text-green-100' : 'bg-white/20 hover:bg-white/30'}`}
                  >
                    <span>{freeTrialRequirements.watchedAd ? 'Ad watched' : (IS_PROD ? (reward.status==='pending' ? 'Playing rewarded ad...' : 'Watch rewarded ad') : 'Mark ad watched (dev)')}</span>
                    {freeTrialRequirements.watchedAd && (
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                </div>
                <div className="mt-4">
                  <button
                    onClick={handleUnlockTrial}
                    disabled={!freeTrialRequirements.watchedAd}
                    className={`w-full py-2 px-4 rounded font-medium ${
                      freeTrialRequirements.watchedAd
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                        : 'bg-white/20 text-white/70 cursor-not-allowed'
                    }`}
                  >
                    Unlock 7-day trial
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