import { useState, useEffect, useRef } from 'react';
import { 
  XMarkIcon,
  LockClosedIcon,
  CheckIcon,
  ExclamationTriangleIcon,
  TicketIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { getApiUrl } from '../utils/config';
import { useAuth } from '../context/AuthContext';
import paypalImage from '../assets/193-1936998_payment-method-47-icons-payment-option-icons-png.png';
import cashfreeImage from '../assets/0_BIy_CblCTVoOl5Zg.png';

const SubscribeModal = ({ isOpen, onClose, plan, onSuccess, loading, userCountry = 'US' }) => {
  const { token } = useAuth();
  const [paymentGateway, setPaymentGateway] = useState('paypal'); // 'paypal' or 'cashfree'
  const [isProcessing, setIsProcessing] = useState(false);
  const [coupon, setCoupon] = useState('');
  const [couponInfo, setCouponInfo] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const paypalButtonsRef = useRef(null);
  const [paypalReady, setPaypalReady] = useState(false);
  const [initializingPaypal, setInitializingPaypal] = useState(false);
  const [paypalError, setPaypalError] = useState('');
  const cashfreeRef = useRef(null);
  const cashfreeInitOnceRef = useRef(false);
  const [pricing, setPricing] = useState(null);
  const [currency, setCurrency] = useState('USD');
  const [price, setPrice] = useState(0);
  const userSwitchedGateway = useRef(false);

  const planDetails = {
    monthly: { name: 'Monthly Plan', price: 1.99, period: 'month' },
    yearly: { name: 'Yearly Plan', price: 21.99, period: 'year' }
  };
  const currentPlan = planDetails[plan];

  // Fetch pricing for the detected country to determine currency and amount
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!isOpen) return;
        const baseUrl = await getApiUrl();
        const resp = await fetch(`${baseUrl}/api/pricing/plans?country=${encodeURIComponent(userCountry || 'US')}`);
        if (!resp.ok) throw new Error('Failed to fetch pricing');
        const data = await resp.json();
        if (cancelled) return;
        setPricing(data?.pricing || null);
        const planType = plan === 'monthly' ? 'monthly' : 'yearly';
        const amt = data?.pricing?.[planType]?.price;
        const cur = data?.pricing?.[planType]?.currency || data?.currency || 'USD';
        if (typeof amt === 'number') setPrice(amt); else setPrice(planDetails[plan]?.price || 0);
        setCurrency(cur);
      } catch (_) {
        // fallback to defaults
        setPrice(planDetails[plan]?.price || 0);
        setCurrency('USD');
      }
    })();
    return () => {
      cancelled = true;
      // Cleanup: only clear the buttons container; keep SDK script to avoid duplicate listeners
      try {
        if (paypalButtonsRef.current) {
          paypalButtonsRef.current.innerHTML = '';
        }
      } catch (_) {}
    };
  }, [isOpen, userCountry, plan]);

  const formatPrice = (p, cur) => {
    const symbols = { USD: '$', INR: '₹', EUR: '€', GBP: '£', CAD: 'C$', AUD: 'A$' };
    return `${symbols[cur] || cur} ${Number(p).toFixed(2)}`;
  };

  // Default payment gateway based on currency unless the user manually switched
  useEffect(() => {
    if (!isOpen) return;
    if (userSwitchedGateway.current) return;
    if (currency === 'INR') setPaymentGateway('cashfree');
    else setPaymentGateway('paypal');
  }, [currency, isOpen]);

  useEffect(() => {
    const base = (typeof price === 'number' ? price : (currentPlan?.price || 0));
    const finalPrice = Math.max(0, base - (couponInfo?.discountAmount || 0));

    if (paymentGateway !== 'paypal') return;
    if (!paypalButtonsRef.current) return;

    let cancelled = false;

    (async () => {
      try {
        setInitializingPaypal(true);
        setPaypalError('');
        // Guard: do not use PayPal for INR (use Cashfree)
        if ((currency || 'USD') === 'INR') {
          setPaypalError('PayPal is unavailable for INR. Please switch to Cashfree.');
          return;
        }
        // Get client ID from backend
        const baseUrl = await getApiUrl();
        const cfgResp = await fetch(`${baseUrl}/api/payments/paypal/config`);
        const cfg = await cfgResp.json();
        const clientId = cfg?.clientId;
        if (!clientId) throw new Error('Missing PayPal client ID');

        // Build SDK src 
        const sdkSrc = `https://www.paypal.com/sdk/js?client-id=${encodeURIComponent(clientId)}&intent=capture&components=buttons`;

        // Global singleton to avoid duplicate loads
        const g = window;
        g.__LB_paypalLoadingPromise = g.__LB_paypalLoadingPromise || {};

        // Load SDK if not already loaded
        if (!g.__LB_paypalLoadingPromise[sdkSrc]) {
          g.__LB_paypalLoadingPromise[sdkSrc] = loadPayPalSDK(sdkSrc);
        }
        await g.__LB_paypalLoadingPromise[sdkSrc];

        // Wait until Buttons API is available
        await new Promise((resolve, reject) => {
          const start = Date.now();
          (function check() {
            if (window.paypal && typeof window.paypal.Buttons === 'function') return resolve();
            if (Date.now() - start > 7000) return reject(new Error('PayPal SDK did not expose Buttons'));
            setTimeout(check, 50);
          })();
        });

        if (cancelled) return;

        // Clear previous buttons
        paypalButtonsRef.current.innerHTML = '';

        window.paypal.Buttons({
          style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal' },
          createOrder: async () => {
            // Create order on backend with coupon
            try {
              const baseUrl = await getApiUrl();
              const resp = await fetch(`${baseUrl}/api/payments/paypal/create-order`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                  plan,
                  couponCode: couponInfo?.code || (coupon?.trim() ? coupon.trim().toUpperCase() : undefined),
                  currency: currency || 'USD',
                  userCountry
                })
              });
              const data = await resp.json();
              if (!resp.ok) throw new Error(data?.message || 'Failed to create order');
              if (data.free) {
                // 100% discount: directly capture without PayPal order
                const capResp = await fetch(`${baseUrl}/api/payments/paypal/capture`, {
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
                onSuccess && onSuccess({ __paypalCaptured: true, method: 'coupon', amount: 0, currency: currency || 'USD' });
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
              const baseUrl = await getApiUrl();
              const resp = await fetch(`${baseUrl}/api/payments/paypal/capture`, {
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
  }, [isOpen, couponInfo, coupon, token, plan, price, currency, paymentGateway]);

  useEffect(() => {
    if (isOpen) {
      setIsProcessing(false);
      setCoupon('');
      setCouponInfo(null);
      setPaypalError('');
      setPaypalReady(false);
      // allow Cashfree to re-initialize on each modal open
      cashfreeInitOnceRef.current = false;
    }
  }, [isOpen]);

  // Initialize Cashfree exactly once per modal open
  useEffect(() => {
    const base = typeof price === 'number' ? price : (planDetails[plan].price || 0);
    const finalPrice = Math.max(0, base - (couponInfo?.discountAmount || 0));

    if (paymentGateway !== 'cashfree' || finalPrice <= 0 || cashfreeInitOnceRef.current) return;
    cashfreeInitOnceRef.current = true;

    // Determine SDK source based on environment
    const isProduction = window.location.hostname === 'www.lifebuddy.space' || 
                        window.location.hostname === 'lifebuddy.space';
    
    // Use the correct Cashfree SDK v3 URL (same for both environments)
    const sdkUrl = 'https://sdk.cashfree.com/js/v3/cashfree.js';

    const g = window;
    g.__LB_cashfreeLoadingPromise = g.__LB_cashfreeLoadingPromise || {};

    const loadSDK = async (url) => {
      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        script.onload = () => {
          console.log('Cashfree SDK loaded successfully from:', url);
          resolve();
        };
        script.onerror = (e) => {
          console.error('Cashfree SDK failed to load from:', url, e);
          reject(e);
        };
        document.body.appendChild(script);
      });
    };

    const ensureInit = async () => {
      try {
        if (g.Cashfree) {
          await initializeCashfree();
          return;
        }

        if (!g.__LB_cashfreeLoadingPromise[sdkUrl]) {
          g.__LB_cashfreeLoadingPromise[sdkUrl] = loadSDK(sdkUrl);
        }
        await g.__LB_cashfreeLoadingPromise[sdkUrl];
        await initializeCashfree();
      } catch (e) {
        console.error('Cashfree SDK initialization failed:', e);
      }
    };

    ensureInit();
  }, [paymentGateway, plan, couponInfo, price, currency]);

  // Reset one-time guard if user switches away from Cashfree
  useEffect(() => {
    if (paymentGateway !== 'cashfree') {
      cashfreeInitOnceRef.current = false;
    }
  }, [paymentGateway]);

  const loadPayPalSDK = (src) => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  };

  const initializeCashfree = async () => {
    try {
      // Check if user is authenticated
      if (!token) {
        throw new Error('Please log in to continue with payment');
      }

      // Cashfree sandbox supports INR only. In non-production, force INR so testing works.
      const isProd = process.env.NODE_ENV === 'production';
      let orderCurrency = (currency || 'INR').toUpperCase();
      if (!isProd && orderCurrency !== 'INR') {
        orderCurrency = 'INR';
        try { toast('Using INR for Cashfree sandbox', { icon: 'ℹ️' }); } catch (_) {}
      }

      const baseUrl = await getApiUrl();
      const response = await fetch(`${baseUrl}/api/payments/cashfree/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ 
          plan, 
          currency: orderCurrency.toUpperCase(),
          amount: parseFloat(price),
          couponCode: coupon?.trim() || undefined, 
          userCountry 
        })
      });
      const data = await response.json().catch(() => ({}));
      
      if (response.status === 401) {
        throw new Error('Authentication failed. Please log in again.');
      }
      if (!response.ok) {
        throw new Error(data?.error || data?.message || `Server error (${response.status})`);
      }

      const { payment_session_id, order_id } = data || {};
      const orderToken = payment_session_id;
      const orderId = order_id;

      // Initialize Cashfree v3 SDK
      const isProduction = window.location.hostname === 'www.lifebuddy.space' || 
                          window.location.hostname === 'lifebuddy.space';
      
      const cashfree = Cashfree({
        mode: isProduction ? "production" : "sandbox"
      });
      cashfreeRef.current = cashfree;

      cashfree.checkout({
        paymentSessionId: orderToken,
        redirectTarget: "_self"
      });
    } catch (err) {
      console.error('Cashfree initialization error:', err);
      try { toast.error(err?.message || 'Failed to create Cashfree order'); } catch (_) {}
    }
  };

  useEffect(() => {
    return () => {
      if (cashfreeRef.current) {
        cashfreeRef.current.destroy();
      }
    };
  }, []);

  const validateCoupon = async () => {
    const code = coupon.trim();
    if (!code) return;
    setValidatingCoupon(true);
    try {
      const baseUrl = await getApiUrl();
      const couponResp = await fetch(`${baseUrl}/api/coupons/validate?code=${encodeURIComponent(code)}`);
      const data = await couponResp.json();
      if (couponResp.ok && data.valid) {
        setCouponInfo(data);
        toast.success(`Coupon applied: -${formatPrice(data.discountAmount || 0, currency)}`);
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

  const handleFreeActivation = async () => {
    try {
      setIsProcessing(true);
      const baseUrl = await getApiUrl();
      const resp = await fetch(`${baseUrl}/api/payments/paypal/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ plan, couponCode: couponInfo?.code || (coupon?.trim() ? coupon.trim().toUpperCase() : undefined) })
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data?.message || 'Failed to activate subscription');
      toast.success('Subscription activated with coupon');
      onSuccess && onSuccess({ __paypalCaptured: true, method: 'coupon', amount: 0, currency: currency || 'USD' });
    } catch (e) {
      toast.error(e?.message || 'Failed to activate');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!isOpen) return null;

  const baseDisplayPrice = typeof price === 'number' && price > 0 ? price : planDetails[plan].price;
  const finalPrice = Math.max(0, baseDisplayPrice - (couponInfo?.discountAmount || 0));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Subscribe to {planDetails[plan].name}
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
          {/* Payment Method */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Payment Method
            </label>
            <div className="flex space-x-4">
              <button
                type="button"
                className={`flex-1 flex flex-col items-center p-4 rounded-lg border-2 ${paymentGateway === 'paypal' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'}`}
                onClick={() => { userSwitchedGateway.current = true; setPaymentGateway('paypal'); }}
              >
                <span className="font-medium mb-2">PayPal</span>
                <img 
                  src={paypalImage} 
                  alt="PayPal payment methods" 
                  className="w-24 h-auto object-contain"
                />
                <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                  International credit cards
                </p>
              </button>

              <button
                type="button"
                className={`flex-1 flex flex-col items-center p-4 rounded-lg border-2 ${paymentGateway === 'cashfree' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'}`}
                onClick={() => { userSwitchedGateway.current = true; setPaymentGateway('cashfree'); }}
              >
                <span className="font-medium mb-2">Cashfree</span>
                <img 
                  src={cashfreeImage} 
                  alt="Cashfree payment methods" 
                  className="w-24 h-auto object-contain"
                />
                <p className="text-xs mt-1 text-gray-500 dark:text-gray-400">
                  UPI, Credit/Debit Cards
                </p>
              </button>
            </div>
          </div>

          {/* Plan Summary */}
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">
                  {planDetails[plan].name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-300">
                  {plan === 'yearly' ? 'Save 17% with yearly billing' : 'Cancel anytime'}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatPrice(finalPrice, currency)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  per {planDetails[plan].period}
                </div>
              </div>
            </div>
            {couponInfo && (
              <div className="mt-2 text-sm text-green-700 dark:text-green-300">Coupon {couponInfo.code} applied (−{formatPrice(couponInfo.discountAmount || 0, currency)})</div>
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

          {/* PayPal */}
          {paymentGateway === 'paypal' ? (
            <div className="py-2">
              <div className="text-center mb-3">
                <div className="text-blue-600 font-bold text-2xl">PayPal</div>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Secure checkout powered by PayPal</p>
              </div>
              {finalPrice === 0 ? (
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
          ) : (
            // Cashfree form
            <div className="py-2">
              <div className="text-center mb-3">
                <div className="text-blue-600 font-bold text-2xl">Cashfree</div>
                <p className="text-gray-600 dark:text-gray-300 text-sm">Secure checkout powered by Cashfree</p>
              </div>
              {finalPrice === 0 ? (
                <div className="text-center">
                  <button 
                    onClick={handleFreeActivation}
                    disabled={isProcessing}
                    className="w-full bg-green-500 text-white py-2 px-4 rounded-md hover:bg-green-600 disabled:opacity-50"
                  >
                    {isProcessing ? 'Processing...' : 'Activate Free'}
                  </button>
                </div>
              ) : (
                <div id="cashfree-payment-element">
                  <p>Redirecting to Cashfree...</p>
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
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
            By proceeding, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
};

export default SubscribeModal;
