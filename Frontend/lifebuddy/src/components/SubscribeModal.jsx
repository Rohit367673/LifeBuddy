import { useState, useEffect, useRef } from 'react';
import { 
  XMarkIcon,
  CreditCardIcon,
  LockClosedIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  TicketIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { getApiUrl } from '../utils/config';
import { useAuth } from '../context/AuthContext';

const SubscribeModal = ({ isOpen, onClose, plan, onSuccess, loading }) => {
  const { token } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [formData, setFormData] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    cardholderName: '',
    email: ''
  });
  const [errors, setErrors] = useState({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [coupon, setCoupon] = useState('');
  const [couponInfo, setCouponInfo] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const paypalButtonsRef = useRef(null);
  const [paypalReady, setPaypalReady] = useState(false);
  const [initializingPaypal, setInitializingPaypal] = useState(false);
  const [paypalError, setPaypalError] = useState('');

  const planDetails = {
    monthly: { name: 'Monthly Plan', price: 9.99, period: 'month' },
    yearly: { name: 'Yearly Plan', price: 99.99, period: 'year' }
  };

  // Load PayPal SDK and render buttons when using PayPal and amount > 0
  useEffect(() => {
    const finalPrice = Math.max(0, (currentPlan?.price || 0) - (couponInfo?.discountAmount || 0));
    if (!isOpen || paymentMethod !== 'paypal' || finalPrice === 0) return;
    if (!paypalButtonsRef.current) return;

    let cancelled = false;

    (async () => {
      try {
        setInitializingPaypal(true);
        setPaypalError('');
        // Get client ID from backend
        const cfgResp = await fetch(`${getApiUrl()}/api/paypal/config`);
        const cfg = await cfgResp.json();
        const clientId = cfg?.clientId;
        if (!clientId) throw new Error('Missing PayPal client ID');

        // Load SDK if not present
        if (!window.paypal) {
          await new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&intent=capture&currency=USD`;
            script.async = true;
            script.onload = resolve;
            script.onerror = () => reject(new Error('Failed to load PayPal SDK'));
            document.body.appendChild(script);
          });
        }

        if (cancelled) return;

        // Clear previous buttons if any
        paypalButtonsRef.current.innerHTML = '';

        window.paypal.Buttons({
          style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal' },
          createOrder: async () => {
            // Create order on backend with coupon
            try {
              const resp = await fetch(`${getApiUrl()}/api/paypal/create-order`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  plan,
                  couponCode: couponInfo?.code || (coupon?.trim() ? coupon.trim().toUpperCase() : undefined),
                  currency: 'USD'
                })
              });
              const data = await resp.json();
              if (!resp.ok) throw new Error(data?.message || 'Failed to create order');
              if (data.free) {
                // 100% discount: directly capture without PayPal order
                const capResp = await fetch(`${getApiUrl()}/api/paypal/capture`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                  },
                  body: JSON.stringify({ plan, couponCode: couponInfo?.code || (coupon?.trim() ? coupon.trim().toUpperCase() : undefined) })
                });
                const cap = await capResp.json();
                if (!capResp.ok) throw new Error(cap?.message || 'Failed to activate subscription');
                toast.success('Subscription activated with coupon');
                onSuccess && onSuccess({ __paypalCaptured: true, method: 'coupon', amount: 0, currency: 'USD' });
                // Throw to stop PayPal flow after we handled activation
                throw new Error('Handled-free-activation');
              }
              return data.orderId;
            } catch (err) {
              if (String(err?.message).includes('Handled-free-activation')) {
                // Prevent rendering errors in console; we already handled success
                return undefined;
              }
              toast.error(err?.message || 'Failed to initiate PayPal order');
              throw err;
            }
          },
          onApprove: async (data) => {
            try {
              const orderId = data.orderID;
              const resp = await fetch(`${getApiUrl()}/api/paypal/capture`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ orderId, plan, couponCode: couponInfo?.code || (coupon?.trim() ? coupon.trim().toUpperCase() : undefined) })
              });
              const resData = await resp.json();
              if (!resp.ok || !resData?.success) throw new Error(resData?.message || 'Capture failed');
              toast.success('Payment completed!');
              onSuccess && onSuccess({ __paypalCaptured: true, method: 'paypal' });
            } catch (err) {
              toast.error(err?.message || 'Failed to capture payment');
            }
          },
          onError: (err) => {
            setPaypalError('PayPal error. Please try again.');
            console.error('PayPal Buttons error:', err);
            toast.error('PayPal error. Please try again.');
          }
        }).render(paypalButtonsRef.current);

        setPaypalReady(true);
      } catch (e) {
        if (!cancelled) {
          console.error(e);
          setPaypalError(e.message || 'Failed to initialize PayPal');
          setPaypalReady(false);
        }
      } finally {
        if (!cancelled) setInitializingPaypal(false);
      }
    })();

    return () => { cancelled = true; };
  }, [isOpen, paymentMethod, couponInfo, coupon, token, plan, currentPlan]);

  const currentPlan = planDetails[plan];

  useEffect(() => {
    if (isOpen) {
      setFormData({
        cardNumber: '',
        expiryDate: '',
        cvv: '',
        cardholderName: '',
        email: ''
      });
      setErrors({});
      setIsProcessing(false);
      setCoupon('');
      setCouponInfo(null);
      setPaypalError('');
      setPaypalReady(false);
    }
  }, [isOpen]);

  const validateForm = () => {
    const newErrors = {};

    if (paymentMethod === 'card') {
      if (!formData.cardNumber) newErrors.cardNumber = 'Card number is required';
      else if (!/^\d{16}$/.test(formData.cardNumber.replace(/\s/g, ''))) {
        newErrors.cardNumber = 'Please enter a valid 16-digit card number';
      }

      if (!formData.expiryDate) newErrors.expiryDate = 'Expiry date is required';
      else if (!/^\d{2}\/\d{2}$/.test(formData.expiryDate)) {
        newErrors.expiryDate = 'Please use MM/YY format';
      }

      if (!formData.cvv) newErrors.cvv = 'CVV is required';
      else if (!/^\d{3,4}$/.test(formData.cvv)) {
        newErrors.cvv = 'Please enter a valid CVV';
      }

      if (!formData.cardholderName) newErrors.cardholderName = 'Cardholder name is required';
      if (!formData.email) newErrors.email = 'Email is required';
      else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleInputChange = (field, value) => {
    let formattedValue = value;
    
    if (field === 'cardNumber') {
      formattedValue = formatCardNumber(value);
    } else if (field === 'expiryDate') {
      formattedValue = formatExpiryDate(value);
    } else if (field === 'cvv') {
      formattedValue = value.replace(/\D/g, '').substring(0, 4);
    }

    setFormData(prev => ({
      ...prev,
      [field]: formattedValue
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateCoupon = async () => {
    const code = coupon.trim();
    if (!code) return;
    setValidatingCoupon(true);
    try {
      const resp = await fetch(`${getApiUrl()}/api/coupons/validate?code=${encodeURIComponent(code)}`);
      const data = await resp.json();
      if (resp.ok && data.valid) {
        setCouponInfo(data);
        toast.success(`Coupon applied: -$${data.discountAmount}`);
      } else {
        setCouponInfo(null);
        toast.error(data.message || 'Invalid coupon');
      }
    } catch (e) {
      setCouponInfo(null);
      toast.error('Failed to validate coupon');
    } finally {
      setValidatingCoupon(false);
    }
  };

  // For 100% discount case when PayPal method selected but amount is zero
  const handleFreeActivation = async () => {
    try {
      setIsProcessing(true);
      const resp = await fetch(`${getApiUrl()}/api/paypal/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ plan, couponCode: couponInfo?.code || (coupon?.trim() ? coupon.trim().toUpperCase() : undefined) })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.message || 'Failed to activate subscription');
      toast.success('Subscription activated with coupon');
      onSuccess && onSuccess({ __paypalCaptured: true, method: 'coupon', amount: 0, currency: 'USD' });
    } catch (e) {
      toast.error(e?.message || 'Failed to activate');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCardPayment = async () => {
    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setIsProcessing(true);
    
    try {
      // Simulate card payment processing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock successful card payment
      const paymentData = {
        method: 'card',
        transactionId: 'CARD_' + Date.now(),
        amount: Math.max(0, currentPlan.price - (couponInfo?.discountAmount || 0)),
        currency: 'USD',
        status: 'completed',
        cardLast4: formData.cardNumber.slice(-4),
        couponCode: couponInfo?.code,
        discountApplied: couponInfo?.discountAmount || 0
      };
      
      onSuccess(paymentData);
    } catch (error) {
      toast.error('Card payment failed. Please check your details and try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (paymentMethod === 'card') {
      await handleCardPayment();
    }
  };

  if (!isOpen) return null;

  const finalPrice = Math.max(0, currentPlan.price - (couponInfo?.discountAmount || 0));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Subscribe to {currentPlan.name}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Plan Summary */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {currentPlan.name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {plan === 'yearly' ? 'Save 17% with yearly billing' : 'Cancel anytime'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  ${finalPrice.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  per {currentPlan.period}
                </div>
              </div>
            </div>
            {couponInfo && (
              <div className="mt-2 text-sm text-green-700 dark:text-green-300">Coupon {couponInfo.code} applied (−${couponInfo.discountAmount})</div>
            )}
          </div>

          {/* Coupon */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Coupon Code (optional)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={coupon}
                onChange={(e)=>setCoupon(e.target.value)}
                placeholder="INFLUENCER10"
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button onClick={validateCoupon} disabled={validatingCoupon || !coupon.trim()} className="px-3 py-2 rounded-lg border border-slate-300 hover:bg-slate-50 flex items-center gap-1">
                <TicketIcon className="w-4 h-4"/>
                Apply
              </button>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="mb-6">
            <h4 className="font-semibold text-gray-900 dark:text-white mb-3">
              Choose Payment Method
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentMethod('card')}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  paymentMethod === 'card'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                }`}
              >
                <CreditCardIcon className="h-6 w-6 mx-auto mb-2 text-gray-600 dark:text-gray-300" />
                <span className="text-sm font-medium">Credit Card</span>
              </button>
              <button
                onClick={() => setPaymentMethod('paypal')}
                className={`p-3 rounded-lg border-2 transition-colors ${
                  paymentMethod === 'paypal'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'
                }`}
              >
                <div className="h-6 w-6 mx-auto mb-2 flex items-center justify-center">
                  <span className="text-blue-600 font-bold text-sm">PayPal</span>
                </div>
                <span className="text-sm font-medium">PayPal</span>
              </button>
            </div>
          </div>

          {/* Payment Form */}
          {paymentMethod === 'card' ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Card Number */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Card Number
                </label>
                <input
                  type="text"
                  value={formData.cardNumber}
                  onChange={(e) => handleInputChange('cardNumber', e.target.value)}
                  placeholder="1234 5678 9012 3456"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.cardNumber ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.cardNumber && (
                  <p className="text-red-500 text-sm mt-1">{errors.cardNumber}</p>
                )}
              </div>

              {/* Cardholder Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cardholder Name
                </label>
                <input
                  type="text"
                  value={formData.cardholderName}
                  onChange={(e) => handleInputChange('cardholderName', e.target.value)}
                  placeholder="John Doe"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.cardholderName ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.cardholderName && (
                  <p className="text-red-500 text-sm mt-1">{errors.cardholderName}</p>
                )}
              </div>

              {/* Expiry and CVV */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Expiry Date
                  </label>
                  <input
                    type="text"
                    value={formData.expiryDate}
                    onChange={(e) => handleInputChange('expiryDate', e.target.value)}
                    placeholder="MM/YY"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.expiryDate ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.expiryDate && (
                    <p className="text-red-500 text-sm mt-1">{errors.expiryDate}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    CVV
                  </label>
                  <input
                    type="text"
                    value={formData.cvv}
                    onChange={(e) => handleInputChange('cvv', e.target.value)}
                    placeholder="123"
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.cvv ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                    }`}
                  />
                  {errors.cvv && (
                    <p className="text-red-500 text-sm mt-1">{errors.cvv}</p>
                  )}
                </div>
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  placeholder="your@email.com"
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
                  }`}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>
            </form>
          ) : (
            <div className="py-2">
              <div className="text-center mb-3">
                <div className="text-blue-600 font-bold text-2xl">PayPal</div>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Secure checkout powered by PayPal</p>
              </div>
              {Math.max(0, (currentPlan?.price || 0) - (couponInfo?.discountAmount || 0)) === 0 ? (
                <div className="text-center">
                  <button onClick={handleFreeActivation} disabled={isProcessing} className="btn btn-primary">
                    {isProcessing ? 'Activating…' : 'Activate with Coupon'}
                  </button>
                </div>
              ) : (
                <div>
                  {paypalError && (
                    <div className="text-red-600 text-sm mb-2 text-center">{paypalError}</div>
                  )}
                  <div ref={paypalButtonsRef}></div>
                  {initializingPaypal && (
                    <div className="text-center text-sm text-gray-500 mt-2">Loading PayPal…</div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Security Notice */}
          <div className="flex items-center mt-6 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <LockClosedIcon className="h-5 w-5 text-green-600 mr-2" />
            <span className="text-sm text-green-700 dark:text-green-300">
              Your payment is secured with SSL encryption
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700">
          {paymentMethod !== 'paypal' && (
            <>
              <button
                onClick={handleSubmit}
                disabled={isProcessing || loading}
                className="w-full btn btn-primary btn-lg"
              >
                {isProcessing ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Processing...
                  </div>
                ) : (
                  `Pay $${finalPrice.toFixed(2)}`
                )}
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
                By clicking "Pay", you agree to our Terms of Service and Privacy Policy
              </p>
            </>
          )}
          {paymentMethod === 'paypal' && Math.max(0, (currentPlan?.price || 0) - (couponInfo?.discountAmount || 0)) === 0 && (
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
              By clicking "Activate with Coupon", you agree to our Terms of Service and Privacy Policy
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SubscribeModal; 