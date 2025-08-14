import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CheckCircleIcon,
  SparklesIcon,
  StarIcon,
  ArrowRightIcon,
  TicketIcon,
  CreditCardIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import { getApiUrl } from '../utils/config';

const SubscribeSuccess = () => {
  const navigate = useNavigate();
  const { token } = useAuth();
  const [countdown, setCountdown] = useState(5);
  const [lastPayment, setLastPayment] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          navigate('/dashboard');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  useEffect(() => {
    (async () => {
      try {
        const resp = await fetch(`${getApiUrl()}/api/subscriptions/billing`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await resp.json();
        const payments = data?.paymentHistory || [];
        if (payments.length) setLastPayment(payments[payments.length - 1]);
      } catch (_) {}
    })();
  }, [token]);

  const features = [
    'Unlimited events and templates',
    'AI-powered insights and recommendations',
    'Advanced analytics and reporting',
    'Priority customer support',
    'Export to PDF and calendar sync',
    'Custom checklists and workflows'
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center">
          {/* Success Icon */}
          <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6">
            <CheckCircleIcon className="h-12 w-12 text-green-600" />
          </div>

          {/* Header */}
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to LifeBuddy Premium! 🎉
          </h1>
          
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-8">
            Your subscription has been activated successfully. You now have access to all premium features.
          </p>

          {/* Payment Summary */}
          {lastPayment && (
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-8 text-left">
              <div className="flex items-center gap-2 mb-2 font-semibold text-gray-900 dark:text-white">
                <CreditCardIcon className="h-5 w-5" /> Payment Details
              </div>
              <div className="text-sm text-gray-700 dark:text-gray-300">
                <div>Transaction: <span className="font-mono">{lastPayment.transactionId}</span></div>
                <div>Amount: <span className="font-semibold">${Number(lastPayment.amount).toFixed(2)} {lastPayment.currency}</span></div>
                {lastPayment.couponCode && (
                  <div className="flex items-center gap-1 mt-1"><TicketIcon className="h-4 w-4"/> Coupon Applied: <span className="font-semibold">{lastPayment.couponCode}</span> (−${Number(lastPayment.discountApplied || 0).toFixed(2)})</div>
                )}
              </div>
            </div>
          )}

          {/* Features List */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-6 mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center justify-center">
              <SparklesIcon className="h-5 w-5 mr-2 text-blue-600" />
              Your Premium Features
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
              {features.map((feature, index) => (
                <div key={index} className="flex items-center">
                  <StarIcon className="h-4 w-4 text-yellow-500 mr-2 flex-shrink-0" />
                  <span className="text-gray-700 dark:text-gray-300 text-sm">
                    {feature}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/dashboard')}
              className="btn btn-primary btn-lg"
            >
              <ArrowRightIcon className="h-5 w-5 mr-2" />
              Go to Dashboard
            </button>
            <button
              onClick={() => navigate('/events')}
              className="btn btn-outline btn-lg"
            >
              <SparklesIcon className="h-5 w-5 mr-2" />
              Create Your First Event
            </button>
          </div>

          {/* Auto-redirect notice */}
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-6">
            Redirecting to dashboard in {countdown} seconds...
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscribeSuccess; 