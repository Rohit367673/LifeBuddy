import { useState, useEffect } from 'react';
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
  BellIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useRef } from 'react';
import SubscribeModal from '../components/SubscribeModal';
import PlanCard from '../components/PlanCard';
import FeatureComparison from '../components/FeatureComparison';
import TestimonialCard from '../components/TestimonialCard';
import FAQAccordion from '../components/FAQAccordion';

const Premium = () => {
  const { subscription, features, usage, startTrial, subscribe, getPlans, hasFeature } = usePremium();
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [showTrialModal, setShowTrialModal] = useState(false);
  const pricingRef = useRef(null);
  const featuresRef = useRef(null);

  useEffect(() => {
    const loadPlans = async () => {
      const plansData = await getPlans();
      setPlans(plansData);
    };
    loadPlans();
  }, [getPlans]);

  useEffect(() => {
    // Scroll to pricing if hash present
    if (window.location.hash === '#pricing' && pricingRef.current) {
      pricingRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const handleStartTrial = async () => {
    setLoading(true);
    const success = await startTrial();
    setLoading(false);
    if (success) {
      setShowTrialModal(false);
      window.location.href = '/dashboard';
    }
  };

  const handleSubscribe = async (plan) => {
    setSelectedPlan(plan);
    setShowSubscribeModal(true);
  };

  const handlePaymentSuccess = async (paymentData) => {
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
      price: 9.99,
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
      price: 99.99,
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
              <button
                onClick={() => featuresRef.current?.scrollIntoView({ behavior: 'smooth' })}
                className="btn btn-outline btn-lg"
              >
                <SparklesIcon className="h-5 w-5 mr-2" />
                See Features
              </button>
            </div>
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
            {pricingPlans.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                currentPlan={subscription?.plan}
                onSubscribe={() => handleSubscribe(plan.id)}
                onStartTrial={() => setShowTrialModal(true)}
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