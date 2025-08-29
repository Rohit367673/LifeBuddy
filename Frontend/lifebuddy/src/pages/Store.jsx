import { useState, useEffect } from 'react';
import { loadAdSenseScript, pushAd } from '../utils/ads';
import { useAuth } from '../context/AuthContext';
import { usePremium } from '../context/PremiumContext';
import LoadingScreen from '../components/LoadingScreen';
import { 
  ShoppingBagIcon,
  GiftIcon,
  StarIcon,
  CheckIcon,
  SparklesIcon,
  FireIcon,
  HeartIcon,
  AcademicCapIcon,
  PaperAirplaneIcon,
  HomeIcon,
  BriefcaseIcon,
  CakeIcon
} from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

const Store = () => {
  const { token } = useAuth();
  const [products, setProducts] = useState({});
  const [purchases, setPurchases] = useState({});
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [activeCategory, setActiveCategory] = useState('all');
  const [showProducts, setShowProducts] = useState(false);

  // Watch-2-ads gating for unlocking AI & Scheduling
  const [aiAdCount, setAiAdCount] = useState(0);
  const [schedAdCount, setSchedAdCount] = useState(0);
  const [isWatchingAd, setIsWatchingAd] = useState(false);
  const [watchingType, setWatchingType] = useState(null); // 'ai' | 'schedule' | null
  const [countdown, setCountdown] = useState(0);
  const [adsenseReady, setAdsenseReady] = useState(false);
  const [adSlotKey, setAdSlotKey] = useState(0);

  const ADS_AI_KEY = 'lb_unlock_ads_count_ai';
  const ADS_SCHED_KEY = 'lb_unlock_ads_count_sched';

  useEffect(() => {
    fetchProducts();
    fetchPurchases();
    // preload local ad counts
    try {
      // Cleanup legacy combined key so it doesn't confuse progress
      const LEGACY_KEY = 'lb_unlock_ads_count';
      if (localStorage.getItem(LEGACY_KEY) != null) {
        localStorage.removeItem(LEGACY_KEY);
      }
    } catch {}
    const savedAi = Number(localStorage.getItem(ADS_AI_KEY) || 0);
    const savedSched = Number(localStorage.getItem(ADS_SCHED_KEY) || 0);
    setAiAdCount(Number.isFinite(savedAi) ? savedAi : 0);
    setSchedAdCount(Number.isFinite(savedSched) ? savedSched : 0);
  }, []);

  // Load AdSense script once (prod only) and mark ready
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!import.meta.env.PROD) return; // never load in dev
    const client = import.meta.env.VITE_ADSENSE_CLIENT;
    const slot = import.meta.env.VITE_ADSENSE_SLOT;
    if (!client || !slot) return; // require config
    loadAdSenseScript()
      .then(() => setAdsenseReady(true))
      .catch(() => console.warn('Failed to load AdSense'));
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/store/products`);
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched products:', data);
        setProducts(data);
      } else {
        console.error('Failed to fetch products:', response.status);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPurchases = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/store/purchases`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Fetched purchases:', data);
        setPurchases(data);
      } else {
        console.error('Failed to fetch purchases:', response.status);
      }
    } catch (error) {
      console.error('Error fetching purchases:', error);
    }
  };

  // Rewarded ad simulation: show a 30s modal, then mark 1 completed view for the selected type
  const watchAd = async (type) => {
    // In production, you should start a rewarded session and rely on SSV.
    // For now we simulate a rewarded ad with a 15s countdown and then ping backend.
    setCountdown(30);
    setWatchingType(type === 'schedule' ? 'schedule' : 'ai');
    setAdSlotKey((k) => k + 1); // force fresh <ins> node
    setIsWatchingAd(true);
  };

  useEffect(() => {
    if (!isWatchingAd || countdown <= 0) return;
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [isWatchingAd, countdown]);

  // After a fresh <ins> mounts, request exactly ONE ad render (prod only)
  useEffect(() => {
    if (!import.meta.env.PROD) return;
    if (!isWatchingAd || !adsenseReady) return;
    const t = setTimeout(() => {
      try {
        pushAd();
      } catch (e) {
        console.warn('AdSense push error:', e);
      }
    }, 50);
    return () => clearTimeout(t);
  }, [adSlotKey, adsenseReady, isWatchingAd]);

  useEffect(() => {
    const completeAdIfDone = async () => {
      if (!isWatchingAd || countdown > 0) return;
      try {
        // Dev-mode endpoint to mark a watch; in production use Rewarded SSV
        await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/subscriptions/trial-tasks/watch-ad`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` }
        });
      } catch (e) {
        // Non-fatal: continue client-side count
        console.warn('watch-ad ping failed (non-fatal in dev):', e);
      }
      if (watchingType === 'schedule') {
        setSchedAdCount(prev => {
          const next = Math.min(2, prev + 1);
          localStorage.setItem(ADS_SCHED_KEY, String(next));
          return next;
        });
      } else {
        setAiAdCount(prev => {
          const next = Math.min(2, prev + 1);
          localStorage.setItem(ADS_AI_KEY, String(next));
          return next;
        });
      }
      setIsWatchingAd(false);
      setWatchingType(null);
    };
    completeAdIfDone();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isWatchingAd, countdown]);

  const unlockNow = async (type) => {
    const countOk = type === 'schedule' ? schedAdCount >= 2 : aiAdCount >= 2;
    if (!countOk) return toast.error('Please watch 2 ads to unlock.');
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5001'}/api/subscriptions/trial`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        return toast.error(err.message || 'Failed to unlock.');
      }
      const data = await res.json();
      toast.success(data.message || 'Unlocked! Enjoy premium features.');
    } catch (e) {
      console.error(e);
      toast.error('Something went wrong while unlocking.');
    }
  };

  const handlePurchase = async (productId, productType) => {
    setPurchasing(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api/store/purchase`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          productId,
          productType,
          stripePaymentIntentId: 'mock_payment_intent'
        })
      });

      if (response.ok) {
        const data = await response.json();
        toast.success(`Successfully purchased ${data.product}!`);
        fetchPurchases();
      } else {
        const error = await response.json();
        toast.error(error.message || 'Purchase failed');
      }
    } catch (error) {
      console.error('Error making purchase:', error);
      toast.error('Purchase failed');
    } finally {
      setPurchasing(false);
    }
  };

  const isOwned = (productId) => {
    return purchases.eventPacks?.some(p => p.packId === productId) ||
           purchases.checklistTemplates?.some(p => p.templateId === productId) ||
           purchases.profileThemes?.some(p => p.themeId === productId);
  };

  const getProductIcon = (productId) => {
    const iconMap = {
      'wedding-pack': HeartIcon,
      'vacation-pack': PaperAirplaneIcon,
      'birthday-pack': CakeIcon,
      'home-move': HomeIcon,
      'career-change': BriefcaseIcon,
      'premium-dark': StarIcon,
      'gradient-sunset': SparklesIcon
    };
    return iconMap[productId] || GiftIcon;
  };

  const getCategoryProducts = () => {
    if (activeCategory === 'all') {
      return [
        ...(products.eventPacks || []),
        ...(products.checklistTemplates || []),
        ...(products.profileThemes || [])
      ];
    }
    return products[activeCategory] || [];
  };

  if (loading) {
    return <LoadingScreen text="Loading store…" />;
  }

  return (
    <div className="space-y-8 mt-8">

      {/* Hero Banner */}
      <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-red-600 text-white rounded-2xl p-8">
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6">
            <ShoppingBagIcon className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Power Up Your Planning</h1>
          <p className="text-xl opacity-90 mb-6">
            Add premium event packs, profile themes, productivity templates, and more.
          </p>
          <div className="flex items-center justify-center space-x-4 text-sm">
            <span className="bg-white/20 px-3 py-1 rounded-full">🎁 Most Used</span>
            <span className="bg-white/20 px-3 py-1 rounded-full">✍️ Editor Choice</span>
            <span className="bg-white/20 px-3 py-1 rounded-full">🔥 Trending</span>
          </div>
        </div>
      </div>

      {/* Unlock Cards (AI + Scheduling) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* AI Assistant Card */}
        <div className="relative bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
          <div className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-purple-100">
              <SparklesIcon className="w-8 h-8 text-purple-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">AI Assistant</h3>
            <p className="text-gray-600 mb-4">Personalized AI by Rohit Kumar for planning, insights, and coaching.</p>
            <div className="text-sm text-gray-700 mb-4">
              Unlock by watching 2 ads • Progress: <span className="font-semibold">{aiAdCount}/2</span>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => watchAd('ai')}
                disabled={isWatchingAd || aiAdCount >= 2}
                className={`px-5 py-3 rounded-lg font-medium text-white ${aiAdCount >= 2 ? 'bg-gray-400' : 'bg-purple-600 hover:bg-purple-700'}`}
              >
                {isWatchingAd && watchingType === 'ai' ? 'Watching…' : aiAdCount >= 2 ? 'Ads Completed' : 'Watch Ad'}
              </button>
              <button
                onClick={() => unlockNow('ai')}
                disabled={aiAdCount < 2}
                className={`px-5 py-3 rounded-lg font-medium ${aiAdCount < 2 ? 'bg-gray-100 text-gray-500' : 'bg-green-600 text-white hover:bg-green-700'}`}
              >
                Unlock Now
              </button>
            </div>
          </div>
        </div>

        {/* Smart Scheduling Card */}
        <div className="relative bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300">
          <div className="p-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center bg-blue-100">
              <AcademicCapIcon className="w-8 h-8 text-blue-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Smart Scheduling</h3>
            <p className="text-gray-600 mb-4">Auto-generate schedules and reminders tailored to your goals.</p>
            <div className="text-sm text-gray-700 mb-4">
              Unlock by watching 2 ads • Progress: <span className="font-semibold">{schedAdCount}/2</span>
            </div>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => watchAd('schedule')}
                disabled={isWatchingAd || schedAdCount >= 2}
                className={`px-5 py-3 rounded-lg font-medium text-white ${schedAdCount >= 2 ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}
              >
                {isWatchingAd && watchingType === 'schedule' ? 'Watching…' : schedAdCount >= 2 ? 'Ads Completed' : 'Watch Ad'}
              </button>
              <button
                onClick={() => unlockNow('schedule')}
                disabled={schedAdCount < 2}
                className={`px-5 py-3 rounded-lg font-medium ${schedAdCount < 2 ? 'bg-gray-100 text-gray-500' : 'bg-green-600 text-white hover:bg-green-700'}`}
              >
                Unlock Now
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      {showProducts && (
      <div className="flex flex-wrap gap-4 justify-center">
        {['all', 'eventPacks', 'checklistTemplates', 'profileThemes'].map((category) => (
          <button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`px-6 py-3 rounded-lg font-medium transition-all ${
              activeCategory === category
                ? 'bg-purple-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category === 'all' && 'All Products'}
            {category === 'eventPacks' && 'Event Packs'}
            {category === 'checklistTemplates' && 'Templates'}
            {category === 'profileThemes' && 'Themes'}
          </button>
        ))}
      </div>
      )}

      {/* Products Grid */}
      {showProducts && (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {getCategoryProducts().map((product) => {
          const IconComponent = getProductIcon(product.id);
          const isProductOwned = isOwned(product.id);
          
          return (
            <div
              key={product.id}
              className={`relative bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 ${
                isProductOwned ? 'opacity-75' : ''
              }`}
            >
              {/* Product Badge */}
              {product.id === 'wedding-pack' && (
                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  🎁 Most Used
                </div>
              )}
              {product.id === 'home-move' && (
                <div className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  ✍️ Editor Choice
                </div>
              )}
              {product.id === 'premium-dark' && (
                <div className="absolute top-4 left-4 bg-purple-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                  🔥 Trending
                </div>
              )}

              {/* Product Header */}
              <div className="p-6 text-center">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center ${
                  product.type === 'eventPack' ? 'bg-blue-100' :
                  product.type === 'checklistTemplate' ? 'bg-green-100' :
                  'bg-purple-100'
                }`}>
                  <IconComponent className={`w-8 h-8 ${
                    product.type === 'eventPack' ? 'text-blue-600' :
                    product.type === 'checklistTemplate' ? 'text-green-600' :
                    'text-purple-600'
                  }`} />
                </div>
                
                <h3 className="text-xl font-bold text-gray-900 mb-2">{product.name}</h3>
                <p className="text-gray-600 text-sm mb-4">{product.description}</p>
                
                <div className="text-3xl font-bold text-gray-900 mb-4">
                  ${product.price}
                </div>
              </div>

              {/* Features List */}
              <div className="px-6 pb-4">
                <div className="space-y-2">
                  {product.features.slice(0, 3).map((feature, index) => (
                    <div key={index} className="flex items-center text-sm">
                      <CheckIcon className="w-4 h-4 text-green-500 mr-2" />
                      <span className="text-gray-700">{feature}</span>
                    </div>
                  ))}
                  {product.features.length > 3 && (
                    <div className="text-sm text-gray-500">
                      +{product.features.length - 3} more features
                    </div>
                  )}
                </div>
              </div>

              {/* Action Button */}
              <div className="p-6 pt-0">
                {isProductOwned ? (
                  <div className="w-full bg-green-100 text-green-800 py-3 px-4 rounded-lg font-medium text-center">
                    ✅ Owned
                  </div>
                ) : (
                  <button
                    onClick={() => handlePurchase(product.id, product.type)}
                    disabled={purchasing}
                    className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
                      product.type === 'eventPack' ? 'bg-blue-500 hover:bg-blue-600 text-white' :
                      product.type === 'checklistTemplate' ? 'bg-green-500 hover:bg-green-600 text-white' :
                      'bg-purple-500 hover:bg-purple-600 text-white'
                    } disabled:opacity-50`}
                  >
                    {purchasing ? 'Processing...' : 'Buy Now'}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Empty State */}
      {showProducts && getCategoryProducts().length === 0 && (
        <div className="text-center py-12">
          <ShoppingBagIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600">Try selecting a different category.</p>
        </div>
      )}

      {/* Bottom CTA */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 text-center">
        {!showProducts ? (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">More Templates and Packs</h2>
            <p className="text-gray-600 mb-6">
              Prefer one-time purchases? Browse our full store of templates, themes, and packs.
            </p>
            <button onClick={() => setShowProducts(true)} className="bg-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors">
              Show All Products
            </button>
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Need Something Custom?</h2>
            <p className="text-gray-600 mb-6">
              Can't find what you're looking for? We can create custom templates and themes just for you.
            </p>
            <button className="bg-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors">
              Request Custom Product
            </button>
          </>
        )}
      </div>

      {/* Rewarded Ad Simulation Modal */}
      {isWatchingAd && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-md text-center">
            <h3 className="text-xl font-bold mb-2">Watching Ad</h3>
            <p className="text-gray-600 mb-4">Please stay for the full ad to earn progress.</p>
            {/* Inline AdSense unit (placed above the timer). In dev, show placeholder only. */}
            <div className="mb-4 flex justify-center">
              {(!import.meta.env.VITE_ADSENSE_CLIENT || !import.meta.env.VITE_ADSENSE_SLOT) ? (
                <div className="text-sm text-red-500">
                  AdSense not configured. Set VITE_ADSENSE_CLIENT and VITE_ADSENSE_SLOT in .env and restart dev server.
                </div>
              ) : (
                <ins
                  key={adSlotKey}
                  className="adsbygoogle"
                  style={import.meta.env.MODE !== 'production'
                    ? { display: 'block', width: '300px', height: '250px', background: '#f0f0f0' }
                    : { display: 'block', width: '100%' }}
                  data-ad-client={import.meta.env.VITE_ADSENSE_CLIENT}
                  data-ad-slot={import.meta.env.VITE_ADSENSE_SLOT}
                  data-ad-format={import.meta.env.MODE !== 'production' ? undefined : 'auto'}
                  data-full-width-responsive={import.meta.env.MODE !== 'production' ? undefined : 'true'}
                  data-adtest={import.meta.env.MODE !== 'production' ? 'on' : undefined}
                ></ins>
              )}
            </div>
            <div className="text-5xl font-bold text-purple-600 mb-4">{countdown}s</div>
            <div className="text-sm text-gray-500 mb-6">
              Ad is served via Google AdSense. Completion is tracked by the timer for now.
            </div>
            <button disabled className="px-5 py-3 rounded-lg bg-gray-200 text-gray-500 cursor-not-allowed w-full">Finishes automatically</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Store; 