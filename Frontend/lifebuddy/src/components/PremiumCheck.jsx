import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePremium } from '../context/PremiumContext';
import { getApiUrl } from '../utils/config';
import { loadAdSenseScript, pushAd } from '../utils/ads';
import LoadingScreen from './LoadingScreen';

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

  // AdSense viewing state
  const [isWatching, setIsWatching] = useState(false);
  const [adKey, setAdKey] = useState(0);
  const [countdown, setCountdown] = useState(30);
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

  // Load AdSense when watching (prod only)
  useEffect(() => {
    if (!IS_PROD || !isWatching) return;
    let cancelled = false;
    (async () => {
      try {
        await loadAdSenseScript();
        if (cancelled) return;
        setTimeout(() => { try { pushAd(); } catch {} }, 100);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [IS_PROD, isWatching]);

  // Countdown tick
  useEffect(() => {
    if (!isWatching || countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [isWatching, countdown]);

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
      await completeTrialRequirement('watchedAd');
      return;
    }
    setReward({ sessionId: '', status: 'starting' });
    setIsWatching(true);
    setAdKey((k) => k + 1);
    setCountdown(30);
    setTimeout(async () => {
      await completeTrialRequirement('watchedAd');
      setIsWatching(false);
      setReward({ sessionId: '', status: 'rewarded' });
    }, 30000);
  };

  // Removed Instagram and share requirements

  if (loading) {
    return <LoadingScreen text="Checking premium status…" />;
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
                  {IS_PROD ? (
                    <div>
                      {!isWatching ? (
                        <button disabled={freeTrialRequirements.watchedAd} onClick={handleWatchAd} className={`w-full py-2 px-4 rounded flex items-center justify-between ${freeTrialRequirements.watchedAd ? 'bg-green-500/20 text-green-100' : 'bg-white/20 hover:bg-white/30'}`}>
                          <span>{freeTrialRequirements.watchedAd ? 'Ad watched' : 'Watch ad'}</span>
                        </button>
                      ) : (
                        <div className="mt-3">
                          <div className="text-xs text-white/80 mb-2">Please keep this open {countdown}s…</div>
                          <ins
                            key={adKey}
                            className="adsbygoogle"
                            style={{ display: 'block' }}
                            data-ad-client={import.meta.env.VITE_ADSENSE_CLIENT}
                            data-ad-slot={import.meta.env.VITE_ADSENSE_SLOT}
                            data-ad-format="auto"
                            data-full-width-responsive="true"
                          ></ins>
                        </div>
                      )}
                    </div>
                  ) : (
                    <button disabled={freeTrialRequirements.watchedAd} onClick={() => completeTrialRequirement('watchedAd')} className="w-full py-2 px-4 rounded-lg font-medium bg-blue-600 text-white flex items-center gap-2 disabled:opacity-50">
                      I watched the ad
                    </button>
                  )}
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