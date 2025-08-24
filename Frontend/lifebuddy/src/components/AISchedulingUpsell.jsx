import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePremium } from '../context/PremiumContext';
import { useAuth } from '../context/AuthContext';
import { LockClosedIcon, SparklesIcon, ClockIcon, PaperAirplaneIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { loadAdSenseScript, pushAd } from '../utils/ads';

export default function AISchedulingUpsell() {
  const navigate = useNavigate();
  const { startTrial } = usePremium();
  const { token } = useAuth();
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [taskState, setTaskState] = useState({
    watchedAd: false,
    loading: false
  });
  const [reward, setReward] = useState({ sessionId: '', status: 'idle' });

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';
  const IS_PROD = import.meta.env.MODE === 'production';

  const handleUpgrade = () => navigate('/premium');

  const handleStartTrial = async () => {
    // Open modal to guide through tasks before unlocking trial
    setShowTrialModal(true);
  };

  // Preload progress when modal opens
  useEffect(() => {
    if (!showTrialModal) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/subscriptions/trial-tasks/progress`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled) return;
        const t = data.trialTasks || {};
        setTaskState((s) => ({
          ...s,
          watchedAd: !!t.watchedAd
        }));
      } catch (_) {}
    })();
    return () => { cancelled = true; };
  }, [showTrialModal]);

  // AdSense viewing state (production only)
  const [isWatching, setIsWatching] = useState(false);
  const [adReady, setAdReady] = useState(false);
  const [adKey, setAdKey] = useState(0);
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (!IS_PROD) return;
    if (!isWatching) return;
    let cancelled = false;
    (async () => {
      try {
        await loadAdSenseScript();
        if (cancelled) return;
        setAdReady(true);
        setTimeout(() => { try { pushAd(); } catch {} }, 100);
      } catch {}
    })();
    return () => { cancelled = true; };
  }, [IS_PROD, isWatching]);

  useEffect(() => {
    if (!isWatching) return;
    if (countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [isWatching, countdown]);

  const markAdWatched = async () => {
    try {
      setTaskState((s) => ({ ...s, loading: true }));
      const res = await fetch(`${API_BASE}/api/subscriptions/trial-tasks/watch-ad`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
      });
      if (res.ok) {
        const data = await res.json();
        setTaskState((s) => ({
          ...s,
          watchedAd: !!data.trialTasks?.watchedAd || true,
          loading: false
        }));
      } else {
        setTaskState((s) => ({ ...s, loading: false }));
      }
    } catch (_) {
      setTaskState((s) => ({ ...s, loading: false }));
    }
  };

  const startWatchAd = async () => {
    if (!IS_PROD) {
      await markAdWatched();
      return;
    }
    setReward({ sessionId: '', status: 'starting' });
    setIsWatching(true);
    setAdKey((k) => k + 1);
    setCountdown(30);
    // After 30s, mark watched
    setTimeout(async () => {
      await markAdWatched();
      setIsWatching(false);
      setReward({ sessionId: '', status: 'rewarded' });
    }, 30000);
  };

  const canUnlock = taskState.watchedAd;

  const handleUnlockTrial = async () => {
    const ok = await startTrial({ requireTasks: true });
    if (ok) {
      setShowTrialModal(false);
    }
  };

  return (
    <div className="min-h-[60vh] w-full flex items-center justify-center p-4">
      {showTrialModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowTrialModal(false)} />
          <div className="relative max-w-lg w-full rounded-2xl bg-white dark:bg-slate-900 border border-white/20 dark:border-slate-700/40 shadow-xl p-6">
            <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-100">Unlock your 7-day Premium trial</h3>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">Complete these quick steps. Then click Unlock.</p>

            <div className="mt-4 space-y-4">
              <div className="p-3 rounded-xl border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-slate-800 dark:text-slate-100">Watch a short ad</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Helps us keep the lights on</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${taskState.watchedAd ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{taskState.watchedAd ? 'Done' : 'Pending'}</span>
                </div>
                <div className="mt-3">
                  {IS_PROD ? (
                    <div>
                      {!isWatching ? (
                        <div className="flex justify-end gap-2">
                          <button disabled={taskState.watchedAd} onClick={startWatchAd} className="text-sm px-3 py-1.5 rounded-md bg-slate-900 text-white disabled:opacity-50 dark:bg-slate-700">{reward.status==='rewarded' ? 'Rewarded ✓' : 'Watch ad'}</button>
                        </div>
                      ) : (
                        <div className="mt-2">
                          <div className="mb-2 text-xs text-slate-500">Please keep this open {countdown}s…</div>
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
                    <>
                      <div className="h-32 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 text-sm">Ad placeholder (dev)</div>
                      <div className="mt-2 flex justify-end">
                        <button disabled={taskState.loading || taskState.watchedAd} onClick={markAdWatched} className="text-sm px-3 py-1.5 rounded-md bg-slate-900 text-white disabled:opacity-50 dark:bg-slate-700">I watched the ad</button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center justify-end gap-2">
              <button onClick={() => setShowTrialModal(false)} className="px-4 py-2 rounded-md text-slate-700 dark:text-slate-300">Close</button>
              <button disabled={!canUnlock || taskState.loading} onClick={handleUnlockTrial} className={`px-4 py-2 rounded-md text-white ${canUnlock ? 'bg-gradient-to-r from-purple-500 to-pink-500' : 'bg-slate-400 dark:bg-slate-600'} disabled:opacity-70`}>
                Unlock 7-day trial
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="max-w-xl w-full rounded-3xl shadow-2xl bg-white/80 dark:bg-slate-900/70 backdrop-blur-xl border border-white/20 dark:border-slate-700/40 p-6 sm:p-8 text-center">
        <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-500 to-blue-500 flex items-center justify-center shadow-md">
          <LockClosedIcon className="w-7 h-7 text-white" />
        </div>
        <h2 className="text-xl sm:text-2xl font-semibold text-slate-800 dark:text-slate-100">AI Scheduling is a Premium feature</h2>
        <p className="mt-2 text-slate-700 dark:text-slate-300 text-sm sm:text-base">
          Upgrade to unlock personalized, AI-generated schedules, or start a free 7‑day trial.
        </p>

        <div className="mt-5 grid grid-cols-1 gap-3 text-left">
          <FeatureItem icon={SparklesIcon} title="Personalized planning" desc="AI understands your goals and splits them into daily, doable steps." />
          <FeatureItem icon={ClockIcon} title="Smart time‑blocking" desc="Auto‑creates optimal time blocks and balances focus and breaks." />
          <FeatureItem icon={PaperAirplaneIcon} title="Instant delivery" desc="Get your plan via Email, Telegram, or WhatsApp with reminders." />
          <FeatureItem icon={CheckCircleIcon} title="Adaptive & simple" desc="One‑tap adjustments, pause/resume, and progress tracking built‑in." />
        </div>

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            onClick={handleUpgrade}
            className="px-5 py-2.5 rounded-lg font-semibold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-lg"
          >
            Upgrade
          </button>
          <button
            onClick={handleStartTrial}
            className="px-5 py-2.5 rounded-lg font-semibold bg-white/70 hover:bg-white/90 text-slate-800 border border-white/40 dark:bg-slate-800/60 dark:hover:bg-slate-800/80 dark:text-slate-100 dark:border-slate-600/60"
          >
            Start Trial
          </button>
        </div>
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          7‑day free trial requires watching one ad. Cancel anytime. Keep your progress.
        </p>
      </div>
    </div>
  );
}

function FeatureItem({ icon: Icon, title, desc }) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5 w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center shrink-0">
        <Icon className="w-5 h-5 text-slate-700 dark:text-slate-200" />
      </div>
      <div>
        <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">{title}</div>
        <div className="text-sm text-slate-600 dark:text-slate-300">{desc}</div>
      </div>
    </div>
  );
}
