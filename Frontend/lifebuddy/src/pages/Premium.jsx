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
import { useRef } from 'react';
import UsernameModal from '../components/UsernameModal';

const Premium = () => {
  const { subscription, features, usage, startTrial, subscribe, getPlans } = usePremium();
  const { user } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFAQ, setShowFAQ] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState('yearly');
  const pricingRef = useRef(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  useEffect(() => {
    const loadPlans = async () => {
      const plansData = await getPlans();
      setPlans(plansData);
    };
    loadPlans();
  }, [getPlans]);

  useEffect(() => {
    // Scroll to pricing if hash or ref present
    if (window.location.hash === '#pricing' && pricingRef.current) {
      pricingRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

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

  const selectedPlanObj = plans.find(p => p.id === selectedPlan);

  const handleUpgradeClick = (e) => {
    e.stopPropagation();
    setShowConfirmModal(true);
  };
  const handleConfirmUpgrade = async () => {
    setShowConfirmModal(false);
    await handleSubscribe(selectedPlan);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative w-full py-20">
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
        <div className="w-full py-12">
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
              <div className="w-full py-8 sm:py-16">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 text-center mb-8 sm:mb-12">Why Upgrade to Premium?</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
          {/* Free Limitations */}
          <div className="bg-white rounded-2xl shadow-lg p-6 sm:p-8">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4 sm:mb-6 flex items-center">
              <LockClosedIcon className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 mr-2 sm:mr-3" />
              Free Users Can't
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center text-gray-600 text-sm sm:text-base">
                <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mr-2 sm:mr-3 flex-shrink-0" />
                <span>Only 2 active events</span>
              </div>
              <div className="flex items-center text-gray-600 text-sm sm:text-base">
                <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mr-2 sm:mr-3 flex-shrink-0" />
                <span>Basic to-do list</span>
              </div>
              <div className="flex items-center text-gray-600 text-sm sm:text-base">
                <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mr-2 sm:mr-3 flex-shrink-0" />
                <span>7-day mood view</span>
              </div>
              <div className="flex items-center text-gray-600 text-sm sm:text-base">
                <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mr-2 sm:mr-3 flex-shrink-0" />
                <span>No calendar sync</span>
              </div>
              <div className="flex items-center text-gray-600 text-sm sm:text-base">
                <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mr-2 sm:mr-3 flex-shrink-0" />
                <span>Ads on page</span>
              </div>
              <div className="flex items-center text-gray-600 text-sm sm:text-base">
                <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mr-2 sm:mr-3 flex-shrink-0" />
                <span>Default badge icons</span>
              </div>
              <div className="flex items-center text-gray-600 text-sm sm:text-base">
                <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mr-2 sm:mr-3 flex-shrink-0" />
                <span>No budget tools</span>
              </div>
              <div className="flex items-center text-gray-600 text-sm sm:text-base">
                <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mr-2 sm:mr-3 flex-shrink-0" />
                <span>Basic support</span>
              </div>
            </div>
          </div>

          {/* Premium Benefits */}
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl shadow-lg p-6 sm:p-8 text-white">
            <h3 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6 flex items-center">
              <SparklesIcon className="w-5 h-5 sm:w-6 sm:h-6 mr-2 sm:mr-3" />
              Premium Users Get
            </h3>
            <div className="space-y-3 sm:space-y-4">
              <div className="flex items-center text-sm sm:text-base">
                <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-300 mr-2 sm:mr-3 flex-shrink-0" />
                <span>Unlimited events</span>
              </div>
              <div className="flex items-center text-sm sm:text-base">
                <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-300 mr-2 sm:mr-3 flex-shrink-0" />
                <span>Unlimited task system</span>
              </div>
              <div className="flex items-center text-sm sm:text-base">
                <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-300 mr-2 sm:mr-3 flex-shrink-0" />
                <span>Full trend graph + analytics</span>
              </div>
              <div className="flex items-center text-sm sm:text-base">
                <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-300 mr-2 sm:mr-3 flex-shrink-0" />
                <span>Full calendar + notifications</span>
              </div>
              <div className="flex items-center text-sm sm:text-base">
                <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-300 mr-2 sm:mr-3 flex-shrink-0" />
                <span>Ad-free experience</span>
              </div>
              <div className="flex items-center text-sm sm:text-base">
                <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-300 mr-2 sm:mr-3 flex-shrink-0" />
                <span>Premium badge glow & animations</span>
              </div>
              <div className="flex items-center text-sm sm:text-base">
                <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-300 mr-2 sm:mr-3 flex-shrink-0" />
                <span>Full event budgeting + charts</span>
              </div>
              <div className="flex items-center text-sm sm:text-base">
                <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-300 mr-2 sm:mr-3 flex-shrink-0" />
                <span>Priority 24h support</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div className="bg-white py-8 sm:py-16">
        <div className="w-full">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 text-center mb-8 sm:mb-12">Loved by Productivity Enthusiasts</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mb-6 sm:mb-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl sm:rounded-2xl p-4 sm:p-6 hover:shadow-lg transition-shadow">
                <div className="text-xl sm:text-2xl mb-3 sm:mb-4">💬</div>
                <p className="text-gray-700 mb-3 sm:mb-4 italic text-sm sm:text-base">"{testimonial.quote}"</p>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-gray-900 text-sm sm:text-base">{testimonial.author}</div>
                    <div className="text-xs sm:text-sm text-gray-600">{testimonial.badge}</div>
                  </div>
                  <div className="text-xs sm:text-sm text-gray-500">
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
              <div id="pricing" ref={pricingRef} className="w-full py-8 sm:py-16">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 text-center mb-8 sm:mb-12">Choose Your Plan</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {plans.map((plan) => {
            const isCurrent = subscription?.plan === plan.id || (plan.id === 'free' && (!subscription || subscription.plan === 'free'));
            const isSelected = selectedPlan === plan.id;
            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl shadow-lg p-6 sm:p-8 transition-all duration-300 outline-none
                  ${plan.id === 'yearly' ? 'ring-4 ring-purple-500 scale-105 z-10' : ''}
                  ${isSelected ? 'border-4 border-blue-500 shadow-2xl scale-105' : ''}
                  ${isCurrent ? 'border-4 border-green-400' : ''}
                  hover:scale-105 hover:shadow-2xl focus:ring-4 focus:ring-blue-400`
                }
              >
                {plan.id === 'yearly' && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-purple-500 text-white px-4 py-1 rounded-full text-sm font-medium animate-pulse">
                      ⭐️ Most Popular
                    </span>
                  </div>
                )}
                <div className="text-center mb-6 sm:mb-8">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                  <div className="text-3xl sm:text-4xl font-bold text-gray-900 mb-1">
                    ${plan.price}
                    {plan.id !== 'free' && <span className="text-base sm:text-lg text-gray-500">/month</span>}
                  </div>
                  {plan.savings && (
                    <p className="text-xs sm:text-sm text-green-600 font-medium">{plan.savings}</p>
                  )}
                  {plan.trial && (
                    <p className="text-xs sm:text-sm text-green-600 font-medium">{plan.trial}</p>
                  )}
                </div>
                <div className="space-y-3 sm:space-y-4 mb-6 sm:mb-8">
                  {plan.features.map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <CheckIcon className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 mr-2 sm:mr-3 flex-shrink-0" />
                      <span className="text-gray-700 text-sm sm:text-base">{feature}</span>
                    </div>
                  ))}
                  {plan.limitations && (
                    <>
                      {plan.limitations.map((limitation, index) => (
                        <div key={index} className="flex items-center">
                          <XMarkIcon className="w-4 h-4 sm:w-5 sm:h-5 text-red-500 mr-2 sm:mr-3 flex-shrink-0" />
                          <span className="text-gray-500 text-sm sm:text-base">{limitation}</span>
                        </div>
                      ))}
                    </>
                  )}
                </div>
                <div className="text-center space-y-3">
                  {/* Plan selection button for mobile */}
                  <button
                    onClick={() => setSelectedPlan(plan.id)}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-colors text-sm sm:text-base
                      ${isSelected ? 'bg-blue-100 text-blue-700 border-2 border-blue-300' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}
                      ${isCurrent ? 'bg-green-100 text-green-700 border-2 border-green-300' : ''}`}
                  >
                    {isCurrent ? 'Current Plan' : isSelected ? 'Selected' : 'Select Plan'}
                  </button>
                  
                  {/* Purchase button - only show when plan is selected */}
                  {!isCurrent && (
                    <button
                      onClick={handleUpgradeClick}
                      disabled={loading || plan.id !== selectedPlan}
                      className={`w-full py-3 px-6 rounded-lg font-medium transition-colors disabled:opacity-50 text-sm sm:text-base
                        ${plan.id === 'monthly' ? 'bg-blue-500 hover:bg-blue-600 text-white' : ''}
                        ${plan.id === 'yearly' ? 'bg-purple-500 hover:bg-purple-600 text-white' : ''}
                        ${plan.id === 'free' ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : ''}
                        ${plan.id !== selectedPlan ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {loading && plan.id === selectedPlan ? 'Processing...' : plan.id === 'monthly' ? 'Choose Monthly' : plan.id === 'yearly' ? 'Choose Yearly' : 'Free'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        {/* Confirmation Modal */}
        {showConfirmModal && selectedPlanObj && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-purple-200">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Confirm Your Upgrade</h3>
                <button
                  onClick={() => setShowConfirmModal(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <span className="text-2xl">&times;</span>
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="text-lg font-semibold text-gray-800 dark:text-gray-100 mb-2">{selectedPlanObj.name}</div>
                <div className="text-3xl font-bold text-purple-600 mb-2">${selectedPlanObj.price}<span className="text-lg text-gray-500">/month</span></div>
                {selectedPlanObj.savings && <div className="text-green-600 font-medium mb-2">{selectedPlanObj.savings}</div>}
                <ul className="mb-4 list-disc list-inside text-gray-700 dark:text-gray-200">
                  {selectedPlanObj.features.map((feature, i) => <li key={i}>{feature}</li>)}
                </ul>
                <div className="text-gray-600 dark:text-gray-300 mb-4">Are you sure you want to upgrade to <span className="font-bold">{selectedPlanObj.name}</span>? You’ll be charged <span className="font-bold">${selectedPlanObj.price}/month</span>.</div>
                <div className="flex gap-4 mt-6">
                  <button
                    onClick={handleConfirmUpgrade}
                    className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-blue-500 text-white font-bold rounded-xl shadow hover:from-purple-600 hover:to-blue-600 transition-all text-lg"
                  >
                    Confirm & Upgrade
                  </button>
                  <button
                    onClick={() => setShowConfirmModal(false)}
                    className="flex-1 py-3 bg-gray-200 text-gray-700 font-bold rounded-xl shadow hover:bg-gray-300 transition-all text-lg"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* FAQ Section */}
      <div className="bg-gray-50 py-8 sm:py-16">
        <div className="w-full">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 text-center mb-8 sm:mb-12">Frequently Asked Questions</h2>
          
          <div className="space-y-4 sm:space-y-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-white rounded-lg p-4 sm:p-6 shadow-sm">
                <button
                  onClick={() => setShowFAQ(showFAQ === index ? null : index)}
                  className="flex items-center justify-between w-full text-left"
                >
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">{faq.question}</h3>
                  <ChevronDownIcon className={`w-4 h-4 sm:w-5 sm:h-5 text-gray-500 transition-transform ${showFAQ === index ? 'rotate-180' : ''}`} />
                </button>
                {showFAQ === index && (
                  <p className="mt-3 sm:mt-4 text-gray-600 text-sm sm:text-base">{faq.answer}</p>
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