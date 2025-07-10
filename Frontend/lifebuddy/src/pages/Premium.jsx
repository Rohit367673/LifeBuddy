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
  ChevronDownIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const Premium = () => {
  const { subscription, features, usage, startTrial, subscribe, getPlans } = usePremium();
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);

  useEffect(() => {
    const loadPlans = async () => {
      const plansData = await getPlans();
      setPlans(plansData);
    };
    loadPlans();
  }, [getPlans]);

  const handleStartTrial = async () => {
    setLoading(true);
    const success = await startTrial();
    setLoading(false);
    if (success) {
      window.location.href = '/dashboard';
    }
  };

  const handleSubscribe = async (plan) => {
    setLoading(true);
    const success = await subscribe(plan);
    setLoading(false);
    if (success) {
      window.location.href = '/dashboard';
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
      quote: "After switching to Premium, I planned my full move-in day without stress.",
      author: "Ayesha",
      badge: "Consistency King 🏆",
      streak: "47 days"
    },
    {
      quote: "The mood tracker and checklist made my mornings 10x better.",
      author: "Varun",
      badge: "Streak Master",
      streak: "31 days"
    },
    {
      quote: "Unlimited events helped me organize my wedding perfectly!",
      author: "Sarah",
      badge: "Event Planner Pro",
      streak: "23 days"
    }
  ];

  const faqs = [
    {
      question: "What happens after trial ends?",
      answer: "You keep all your data and revert to the free tier. No data loss, no surprises."
    },
    {
      question: "Can I cancel anytime?",
      answer: "Yes! Cancel anytime with no lock-ins or hidden fees."
    },
    {
      question: "Are my payments secure?",
      answer: "Absolutely! We use Stripe for secure, encrypted payment processing."
    },
    {
      question: "Do I lose my data if I downgrade?",
      answer: "No, your data stays safe. You'll just have limited access to features."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="text-center">
            {/* Animated Badge */}
            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 rounded-full mb-8 animate-pulse">
              <SparklesIcon className="w-10 h-10 text-white" />
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              Unlock Your Full Potential with LifeBuddy Premium
            </h1>
            <p className="text-xl md:text-2xl mb-8 opacity-90 max-w-3xl mx-auto">
              Track more, plan smarter, and stay consistent like never before.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={handleStartTrial}
                disabled={loading}
                className="bg-white text-blue-600 px-8 py-4 rounded-lg font-bold text-lg hover:bg-gray-100 transition-all duration-300 shadow-lg hover:shadow-xl animate-pulse"
              >
                {loading ? 'Starting Trial...' : 'Start Free 7-Day Trial'}
              </button>
              <button
                onClick={() => document.getElementById('pricing').scrollIntoView({ behavior: 'smooth' })}
                className="border-2 border-white text-white px-8 py-4 rounded-lg font-bold text-lg hover:bg-white hover:text-blue-600 transition-all duration-300"
              >
                View Pricing Plans
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Current Usage (if free user) */}
      {subscription?.plan === 'free' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Your Current Usage</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">{usage.activeEvents || 0}/2</div>
                <div className="text-gray-600 mb-4">Active Events</div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${getUsagePercentage('activeEvents')}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600 mb-2">{usage.dailyTasks || 0}/10</div>
                <div className="text-gray-600 mb-4">Daily Tasks</div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-green-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${getUsagePercentage('dailyTasks')}%` }}
                  ></div>
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600 mb-2">{usage.moodEntries || 0}/7</div>
                <div className="text-gray-600 mb-4">Mood History (days)</div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div 
                    className="bg-purple-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${getUsagePercentage('moodEntries')}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Premium Benefits Showcase */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">Why Upgrade to Premium?</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Free Limitations */}
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <LockClosedIcon className="w-6 h-6 text-red-500 mr-3" />
              Free Users Can't
            </h3>
            <div className="space-y-4">
              <div className="flex items-center text-gray-600">
                <XMarkIcon className="w-5 h-5 text-red-500 mr-3" />
                <span>Only 2 active events</span>
              </div>
              <div className="flex items-center text-gray-600">
                <XMarkIcon className="w-5 h-5 text-red-500 mr-3" />
                <span>Basic to-do list</span>
              </div>
              <div className="flex items-center text-gray-600">
                <XMarkIcon className="w-5 h-5 text-red-500 mr-3" />
                <span>7-day mood view</span>
              </div>
              <div className="flex items-center text-gray-600">
                <XMarkIcon className="w-5 h-5 text-red-500 mr-3" />
                <span>No calendar sync</span>
              </div>
              <div className="flex items-center text-gray-600">
                <XMarkIcon className="w-5 h-5 text-red-500 mr-3" />
                <span>Ads on page</span>
              </div>
              <div className="flex items-center text-gray-600">
                <XMarkIcon className="w-5 h-5 text-red-500 mr-3" />
                <span>Default badge icons</span>
              </div>
              <div className="flex items-center text-gray-600">
                <XMarkIcon className="w-5 h-5 text-red-500 mr-3" />
                <span>No budget tools</span>
              </div>
              <div className="flex items-center text-gray-600">
                <XMarkIcon className="w-5 h-5 text-red-500 mr-3" />
                <span>Basic support</span>
              </div>
            </div>
          </div>

          {/* Premium Benefits */}
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg p-8 text-white">
            <h3 className="text-2xl font-bold mb-6 flex items-center">
              <SparklesIcon className="w-6 h-6 mr-3" />
              Premium Users Get
            </h3>
            <div className="space-y-4">
              <div className="flex items-center">
                <CheckIcon className="w-5 h-5 text-green-300 mr-3" />
                <span>Unlimited events</span>
              </div>
              <div className="flex items-center">
                <CheckIcon className="w-5 h-5 text-green-300 mr-3" />
                <span>Unlimited task system</span>
              </div>
              <div className="flex items-center">
                <CheckIcon className="w-5 h-5 text-green-300 mr-3" />
                <span>Full trend graph + analytics</span>
              </div>
              <div className="flex items-center">
                <CheckIcon className="w-5 h-5 text-green-300 mr-3" />
                <span>Full calendar + notifications</span>
              </div>
              <div className="flex items-center">
                <CheckIcon className="w-5 h-5 text-green-300 mr-3" />
                <span>Ad-free experience</span>
              </div>
              <div className="flex items-center">
                <CheckIcon className="w-5 h-5 text-green-300 mr-3" />
                <span>Premium badge glow & animations</span>
              </div>
              <div className="flex items-center">
                <CheckIcon className="w-5 h-5 text-green-300 mr-3" />
                <span>Full event budgeting + charts</span>
              </div>
              <div className="flex items-center">
                <CheckIcon className="w-5 h-5 text-green-300 mr-3" />
                <span>Priority 24h support</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">Loved by Productivity Enthusiasts</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="text-2xl mb-4">💬</div>
                <p className="text-gray-700 mb-4 italic">"{testimonial.quote}"</p>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900">{testimonial.author}</div>
                    <div className="text-sm text-gray-600">{testimonial.badge}</div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Streak: {testimonial.streak}
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <div className="text-center text-gray-600">
            <p className="text-lg">Used by people preparing for weddings, exams, job interviews & more.</p>
          </div>
        </div>
      </div>

      {/* Pricing Plans */}
      <div id="pricing" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">Choose Your Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {plans.map((plan) => {
            const isCurrent = subscription?.plan === plan.id || (plan.id === 'free' && (!subscription || subscription.plan === 'free'));
            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-lg p-8 ${
                  plan.id === 'yearly' ? 'ring-2 ring-purple-500 scale-105' : ''
                } ${isCurrent ? 'border-4 border-green-400' : ''}`}
              >
                {plan.id === 'yearly' && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium animate-pulse">
                      ⭐️ Most Popular
                    </span>
                  </div>
                )}
                <div className="text-center mb-8">
                  <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="text-4xl font-bold text-gray-900 mb-1">
                    ${plan.price}
                    {plan.id !== 'free' && <span className="text-lg text-gray-500">/month</span>}
                  </div>
                  {plan.savings && (
                    <p className="text-sm text-green-600 font-medium">{plan.savings}</p>
                  )}
                  {plan.trial && (
                    <p className="text-sm text-green-600 font-medium">{plan.trial}</p>
                  )}
                </div>
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <CheckIcon className="w-5 h-5 text-green-500 mr-3" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                  {plan.limitations && (
                    <>
                      {plan.limitations.map((limitation, index) => (
                        <div key={index} className="flex items-center">
                          <XMarkIcon className="w-5 h-5 text-red-500 mr-3" />
                          <span className="text-gray-500">{limitation}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
                <div className="text-center">
                  {isCurrent ? (
                    <div className="text-green-600 font-bold">Current Plan</div>
                  ) : plan.id === 'monthly' ? (
                    <button
                      onClick={() => handleSubscribe('monthly')}
                      disabled={loading}
                      className="w-full bg-blue-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Processing...' : 'Choose Monthly'}
                    </button>
                  ) : plan.id === 'yearly' ? (
                    <button
                      onClick={() => handleSubscribe('yearly')}
                      disabled={loading}
                      className="w-full bg-purple-500 text-white py-3 px-6 rounded-lg font-medium hover:bg-purple-600 transition-colors disabled:opacity-50"
                    >
                      {loading ? 'Processing...' : 'Choose Yearly'}
                    </button>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-gray-900 text-center mb-12">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg p-6 shadow-sm">
                <button
                  onClick={() => setShowFAQ(showFAQ === index ? null : index)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h3 className="text-lg font-semibold text-gray-900">{faq.question}</h3>
                  <ChevronDownIcon className={`w-5 h-5 text-gray-500 transition-transform ${showFAQ === index ? 'rotate-180' : ''}`} />
                </button>
                {showFAQ === index && (
                  <p className="mt-4 text-gray-600">{faq.answer}</p>
                )}
              </div>
            ))}
          </div>
          
          <div className="text-center mt-12">
            <button className="bg-blue-500 text-white px-8 py-3 rounded-lg font-medium hover:bg-blue-600 transition-colors">
              Still unsure? Talk to us
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Premium; 