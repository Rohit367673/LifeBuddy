import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
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

  useEffect(() => {
    fetchProducts();
    fetchPurchases();
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
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
      </div>
    );
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

      {/* Category Filter */}
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

      {/* Products Grid */}
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

      {/* Empty State */}
      {getCategoryProducts().length === 0 && (
        <div className="text-center py-12">
          <ShoppingBagIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600">Try selecting a different category.</p>
        </div>
      )}

      {/* Bottom CTA */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8 text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">Need Something Custom?</h2>
        <p className="text-gray-600 mb-6">
          Can't find what you're looking for? We can create custom templates and themes just for you.
        </p>
        <button className="bg-purple-600 text-white px-8 py-3 rounded-lg font-medium hover:bg-purple-700 transition-colors">
          Request Custom Product
        </button>
      </div>
    </div>
  );
};

export default Store; 