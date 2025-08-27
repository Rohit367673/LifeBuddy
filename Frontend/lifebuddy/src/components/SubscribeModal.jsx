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

const SubscribeModal = ({ isOpen, onClose, plan, onSuccess, loading }) => {
  const { token } = useAuth();
  const paymentMethod = 'paypal'; // Only PayPal is available
  const [isProcessing, setIsProcessing] = useState(false);
  const [coupon, setCoupon] = useState('');
  const [couponInfo, setCouponInfo] = useState(null);
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const paypalButtonsRef = useRef(null);
  const [paypalReady, setPaypalReady] = useState(false);
  const [initializingPaypal, setInitializingPaypal] = useState(false);
  const [paypalError, setPaypalError] = useState('');

  const planDetails = {
    monthly: { name: 'Monthly Plan', price: 1.99, period: 'month' },
    yearly: { name: 'Yearly Plan', price: 21.99, period: 'year' }
  };
  const currentPlan = planDetails[plan];

  useEffect(() => {
    const finalPrice = Math.max(0, (currentPlan?.price || 0) - (couponInfo?.discountAmount || 0));
    if (!isOpen || finalPrice === 0) return;
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
  }, [isOpen, couponInfo, coupon, token, plan]);

  useEffect(() => {
    if (isOpen) {
      setIsProcessing(false);
      setCoupon('');
      setCouponInfo(null);
      setPaypalError('');
      setPaypalReady(false);
    }
  }, [isOpen]);

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

  if (!isOpen) return null;

  const finalPrice = Math.max(0, planDetails[plan].price - (couponInfo?.discountAmount || 0));

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
                  ${finalPrice.toFixed(2)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-300">
                  per {planDetails[plan].period}
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

          {/* PayPal */}
          <div className="py-2">
            <div className="text-center mb-3">
              <div className="text-blue-600 font-bold text-2xl">PayPal</div>
              <p className="text-gray-600 dark:text-gray-300 text-sm">Secure checkout powered by PayPal</p>
            </div>
            {Math.max(0, (planDetails[plan].price || 0) - (couponInfo?.discountAmount || 0)) === 0 ? (
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