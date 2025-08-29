import { useState, useEffect, useCallback, useRef } from 'react';
import { usePremium } from '../context/PremiumContext';
import { useAuth } from '../context/AuthContext';
import { 
  CheckIcon, 
  StarIcon,
  SparklesIcon,
  GiftIcon,
  LockClosedIcon,
  ShieldCheckIcon,
  ClockIcon,
  XMarkIcon,
  ChevronDownIcon,
  FireIcon,
  TrophyIcon,
  HeartIcon,
  ChartBarIcon,
  CalendarIcon,
  CogIcon,
  UserGroupIcon,
  DocumentTextIcon,
  BellIcon,
  PlayCircleIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import SubscribeModal from '../components/SubscribeModal';
import PlanCard from '../components/PlanCard';
import FeatureComparison from '../components/FeatureComparison';
import TestimonialCard from '../components/TestimonialCard';
import FAQAccordion from '../components/FAQAccordion';
import { loadAdSenseScript, pushAd } from '../utils/ads';
import LoadingScreen from '../components/LoadingScreen';

const Premium = () => {
  const { subscription, features, usage, startTrial, subscribe, getPlans, hasFeature, fetchSubscriptionStatus } = usePremium();
  const { user, token } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const [userLocation, setUserLocation] = useState({ country: 'US' });
  const pricingRef = useRef(null);
  const featuresRef = useRef(null);
  const [watchedAd, setWatchedAd] = useState(false);
  const [reward, setReward] = useState({ sessionId: '', status: 'idle' });
  const cashfreeHandledRef = useRef(false);

  const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5001';
  const IS_PROD = import.meta.env.MODE === 'production';

  // AdSense viewing state (production only)
  const [isWatching, setIsWatching] = useState(false);
  const [adKey, setAdKey] = useState(0);
  const [countdown, setCountdown] = useState(30);

  const loadPlans = useCallback(async () => {
    const plansData = await getPlans();
    setPlans(plansData);
  }, [getPlans]);

  useEffect(() => {
    loadPlans();
  }, [loadPlans]);

  useEffect(() => {
    // Scroll to pricing if hash present
    if (window.location.hash === '#pricing' && pricingRef.current) {
      pricingRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  // Detect user location
  useEffect(() => {
    const detectLocation = async () => {
      try {
        // Try to get location from browser geolocation API
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              try {
                // Use a geolocation service to get country from coordinates
                const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${position.coords.latitude}&longitude=${position.coords.longitude}&localityLanguage=en`);
                if (response.ok) {
                  const data = await response.json();
                  setUserLocation({ country: data.countryCode || 'US' });
                }
              } catch (error) {
                console.log('Geolocation service error:', error);
              }
            },
            (error) => {
              console.log('Geolocation error:', error);
              // Fallback to IP-based detection
              detectLocationByIP();
            }
          );
        } else {
          detectLocationByIP();
        }
      } catch (error) {
        console.log('Location detection error:', error);
      }
    };

    const detectLocationByIP = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/');
        if (response.ok) {
          const data = await response.json();
          setUserLocation({ country: data.country_code || 'US' });
        }
      } catch (error) {
        console.log('IP location detection error:', error);
        // Keep default 'US'
      }
    };

    detectLocation();
  }, []);

  useEffect(() => {
    fetchSubscriptionStatus();
    // Load AdSense script in production
    if (IS_PROD) {
      loadAdSenseScript();
    }
  }, [IS_PROD]); // Remove fetchSubscriptionStatus from dependencies to prevent infinite loop

  // Handle Cashfree return: confirm order and activate subscription
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const from = params.get('from');
    const orderId = params.get('order_id');

    if (!token || cashfreeHandledRef.current) return;
    if (from === 'cashfree' && orderId) {
      cashfreeHandledRef.current = true;
      (async () => {
        try {
          setLoading(true);
          const res = await fetch(`${API_BASE}/api/payments/cashfree/confirm`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`
            },
            body: JSON.stringify({ orderId })
          });
          const data = await res.json().catch(() => ({}));
          if (res.ok && (data?.success || data?.subscription)) {
            toast.success('Payment confirmed! Premium activated.');
            await fetchSubscriptionStatus();
            // Clean URL params and redirect to success page
            try {
              const url = new URL(window.location.href);
              url.searchParams.delete('from');
              url.searchParams.delete('order_id');
              window.history.replaceState({}, document.title, url.pathname + url.search + url.hash);
            } catch {}
            window.location.href = '/subscribe-success';
          } else {
            toast.error(data?.message || 'Payment confirmation failed.');
          }
        } catch (e) {
          toast.error('Payment confirmation failed.');
        } finally {
          setLoading(false);
        }
      })();
    }
  }, [token, API_BASE, fetchSubscriptionStatus]);

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

  // Countdown tick for ad watching
  useEffect(() => {
    if (!isWatching || countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [isWatching, countdown]);

  // Load trial progress
  useEffect(() => {
    (async () => {
      try {
        if (!token) return;
        const res = await fetch(`${API_BASE}/api/subscriptions/trial-tasks/progress`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setWatchedAd(!!data?.trialTasks?.watchedAd);
        }
      } catch {}
    })();
  }, [token]);

  const handleStartTrial = async () => {
    setLoading(true);
    const success = await startTrial({ requireTasks: true });
    setLoading(false);
    if (success) {
      setShowTrialModal(false);
      window.location.href = '/dashboard';
    }
  };

  const handleStartTrialWithTasks = async () => {
    try {
      setLoading(true);
      const resp = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/subscriptions/trial?requireTasks=true`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await resp.json();
      setLoading(false);
      if (resp.ok) {
        toast.success('Trial unlocked for 7 days!');
        window.location.href = '/dashboard';
      } else {
        toast.error(data.message || 'Complete the tasks to unlock the trial');
      }
    } catch (e) {
      setLoading(false);
      toast.error('Failed to start trial');
    }
  };

  const callTrialTask = async (path, successMsg) => {
    try {
      const resp = await fetch(`${API_BASE}/api/subscriptions/${path}`, {
        method: 'POST', headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await resp.json();
      if (resp.ok) {
        toast.success(successMsg);
        if (path === 'trial-tasks/watch-ad') setWatchedAd(true);
      }
      else toast.error(data.message || 'Failed');
    } catch (_) { toast.error('Failed'); }
  };

  // Start AdSense-based watch flow (30s) and then mark task complete
  const startWatchAd = async () => {
    if (!IS_PROD) {
      await callTrialTask('trial-tasks/watch-ad', 'Ad watched ✓');
      return;
    }
    setReward({ sessionId: '', status: 'starting' });
    setIsWatching(true);
    setAdKey((k) => k + 1);
    setCountdown(30);
    setTimeout(async () => {
      await callTrialTask('trial-tasks/watch-ad', 'Ad watched ✓');
      setIsWatching(false);
      setReward({ sessionId: '', status: 'rewarded' });
      setWatchedAd(true);
    }, 30000);
  };

  const handleSubscribe = async (plan) => {
    setSelectedPlan(plan);
    setShowSubscribeModal(true);
  };

  const handlePaymentSuccess = async (paymentData) => {
    // If PayPal capture already activated subscription on the backend, skip generic subscribe
    if (paymentData?.__paypalCaptured) {
      try {
        setLoading(true);
        await fetchSubscriptionStatus();
        setShowSubscribeModal(false);
        window.location.href = '/subscribe-success';
      } finally {
        setLoading(false);
      }
      return;
    }

    // Fallback: use generic subscribe (e.g., card or mock payments)
    setLoading(true);
    const success = await subscribe(selectedPlan, paymentData);
    setLoading(false);
    if (success) {
      setShowSubscribeModal(false);
      window.location.href = '/subscribe-success';
    }
  };

  const getUsagePercentage = (type) => {
    const limits = {
      activeEvents: { free: 2, current: usage.activeEvents || 0 },
      dailyTasks: { free: 10, current: usage.dailyTasks || 0 },
      moodEntries: { free: 7, current: usage.moodEntries || 0 }
    };
    const limit = limits[type];
    return Math.min((limit.current / limit.free) * 100, 100);
  };

  const testimonials = [
    {
      quote: "LifeBuddy Premium transformed how I plan my life. The unlimited events and AI insights helped me organize my wedding perfectly!",
      author: "Sarah Chen",
      badge: "Event Planner Pro 🏆",
      streak: "23 days",
      avatar: "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face"
    },
    {
      quote: "After switching to Premium, I planned my full move-in day without stress. The checklist templates are a game-changer!",
      author: "Ayesha Patel",
      badge: "Consistency King 🏆",
      streak: "47 days",
      avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face"
    },
    {
      quote: "The mood tracker and productivity analytics made my mornings 10x better. Worth every penny!",
      author: "Varun Sharma",
      badge: "Streak Master",
      streak: "31 days",
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face"
    }
  ];

  const faqs = [
    {
      question: "What happens after my trial ends?",
      answer: "You keep all your data and revert to the free tier. No data loss, no surprises. You can upgrade anytime to continue enjoying premium features."
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer: "Yes! Cancel anytime with no lock-ins or hidden fees. You'll continue to have access until the end of your current billing period."
    },
    {
      question: "What payment methods do you accept?",
      answer: "We accept all major credit cards, PayPal, and Apple Pay. All payments are processed securely through our trusted payment partners."
    },
    {
      question: "Is my data safe and private?",
      answer: "Absolutely! We use enterprise-grade encryption and never share your personal data. Your privacy is our top priority."
    },
    {
      question: "Can I switch between monthly and yearly plans?",
      answer: "Yes! You can upgrade, downgrade, or switch plans anytime from your account settings. Changes take effect immediately."
    },
    {
      question: "Do you offer refunds?",
      answer: "We offer a 30-day money-back guarantee. If you're not satisfied, contact our support team for a full refund."
    }
  ];

  const pricingPlans = [
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
      description: 'Best value - save 20%',
      features: [
        'Everything in Monthly',
        'Early access to new features',
        'Exclusive templates',
        'Advanced reporting',
        'Priority Feedback',
        'Unlimited Event Templates',
        'Unlimited AI scheduling'
      ],
      limitations: [],
      buttonText: 'Start Yearly',
      buttonVariant: 'primary',
      popular: false,
      savings: 'Save 477 Rs'
    }
  ];

  const featureComparison = {
    features: [
      {
        name: 'Event Planning',
        free: '2 events max',
        premium: 'Unlimited events'
      },
      {
        name: 'Templates',
        free: 'Basic templates',
        premium: 'All premium templates'
      },
      {
        name: 'AI Insights',
        free: '❌',
        premium: '✅'
      },
      {
        name: 'Analytics',
        free: 'Basic stats',
        premium: 'Advanced analytics'
      },
      {
        name: 'Export Options',
        free: '❌',
        premium: 'PDF, CSV, Calendar'
      },
      {
        name: 'Priority Support',
        free: '❌',
        premium: '✅'
      },
      {
        name: 'Calendar Sync',
        free: '❌',
        premium: '✅'
      },
      {
        name: 'Custom Checklists',
        free: 'Basic',
        premium: 'Advanced + AI'
      }
    ]
  };

  if (loading) {
    return <LoadingScreen text="Preparing premium experience…" />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-sm font-medium">
                <SparklesIcon className="h-4 w-4 mr-2" />
                Premium Features
              </div>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 dark:text-white mb-6">
              Unlock Your Full Potential with{' '}
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                LifeBuddy Premium
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
              Transform your life planning with unlimited events, AI-powered insights, advanced analytics, and exclusive templates. 
              Join thousands of users who've already upgraded their productivity.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => pricingRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="btn btn-primary btn-lg"
              >
                <StarIcon className="h-5 w-5 mr-2" />
                View Plans
              </button>
              <a
                href="#trial"
                className="btn btn-outline btn-lg"
              >
                <SparklesIcon className="h-5 w-5 mr-2" />
                Start Trial Tasks
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Trial Tasks */}
      <div id="trial" className="py-12 bg-white dark:bg-gray-800">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Unlock 7‑day Premium Trial</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-6">Watch one ad to enjoy full access for a week.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-slate-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold mb-1">Watch an ad</div>
                  <p className="text-sm text-gray-600 dark:text-gray-300">Short video to support LifeBuddy.</p>
                </div>
                <span className={`text-xs px-2 py-1 rounded ${watchedAd ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300'}`}>{watchedAd ? 'Done' : 'Pending'}</span>
              </div>
              <div className="mt-3">
                {IS_PROD ? (
                  <div>
                    {!isWatching ? (
                      <div className="flex justify-end">
                        <button disabled={watchedAd} onClick={startWatchAd} className="px-3 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50">
                          {reward.status==='rewarded' ? 'Rewarded ✓' : 'Watch ad'}
                        </button>
                      </div>
                    ) : (
                      <div>
                        <div className="mb-2 text-xs text-gray-600 dark:text-gray-300">Please keep this open {countdown}s…</div>
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
                  <div className="flex justify-end">
                    <button disabled={watchedAd} onClick={() => callTrialTask('trial-tasks/watch-ad', 'Ad watched ✓')} className="px-3 py-2 rounded-lg bg-blue-600 text-white flex items-center gap-2 disabled:opacity-50">
                      <PlayCircleIcon className="w-4 h-4"/> I watched the ad
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="mt-4">
            <button onClick={handleStartTrialWithTasks} disabled={loading} className="px-4 py-2 rounded-lg bg-emerald-600 text-white disabled:opacity-60">
              {loading ? 'Unlocking...' : 'Unlock Trial'}
            </button>
          </div>
        </div>
      </div>

      {/* Feature Comparison */}
      <div ref={featuresRef} className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Free vs Premium Comparison
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              See what you're missing out on with the free plan
            </p>
          </div>
          <FeatureComparison data={featureComparison} />
        </div>
      </div>

      {/* Testimonials */}
      <div className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Loved by Thousands
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              See what our premium users are saying
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <TestimonialCard key={index} {...testimonial} />
            ))}
                  </div>
                </div>
              </div>

      {/* Pricing Section */}
      <div ref={pricingRef} className="py-16 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Choose Your Plan
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Start free, upgrade when you're ready
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                currentPlan={subscription?.plan}
                onSubscribe={() => handleSubscribe(plan.id)}
                onStartTrial={() => setShowTrialModal(true)}
                userCountry={userLocation?.country || 'US'}
              />
            ))}
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="py-16 bg-gray-50 dark:bg-gray-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
              Frequently Asked Questions
            </h2>
            <p className="text-lg text-gray-600 dark:text-gray-300">
              Everything you need to know about LifeBuddy Premium
            </p>
                  </div>
          <FAQAccordion faqs={faqs} />
                  </div>
                </div>

      {/* CTA Section */}
      <div className="py-16 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Transform Your Life Planning?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of users who've already upgraded to Premium
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
              onClick={() => handleSubscribe('monthly')}
              className="btn btn-white btn-lg"
            >
              <StarIcon className="h-5 w-5 mr-2" />
              Start Monthly Plan
                  </button>
                    <button
              onClick={() => handleSubscribe('yearly')}
              className="btn btn-outline-white btn-lg"
            >
              <GiftIcon className="h-5 w-5 mr-2" />
              Save with Yearly
                    </button>
              </div>
        </div>
              </div>

      {/* Modals */}
      {showSubscribeModal && (
        <SubscribeModal
          isOpen={showSubscribeModal}
          onClose={() => setShowSubscribeModal(false)}
          plan={selectedPlan}
          onSuccess={handlePaymentSuccess}
          loading={loading}
          userCountry={userLocation?.country || 'US'}
        />
      )}

      {showTrialModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Start Your Free Trial
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Enjoy all premium features for 7 days, no credit card required.
            </p>
            <div className="flex gap-4">
                  <button
                onClick={handleStartTrial}
                disabled={loading}
                className="btn btn-primary flex-1"
                  >
                {loading ? 'Starting...' : 'Start Trial'}
                  </button>
                  <button
                onClick={() => setShowTrialModal(false)}
                className="btn btn-outline flex-1"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
      )}
    </div>
  );
};

export default Premium; 