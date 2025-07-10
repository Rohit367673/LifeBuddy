import { usePremium } from '../context/PremiumContext';
import { StarIcon, SparklesIcon } from '@heroicons/react/24/outline';

const PremiumFeature = ({ 
  feature, 
  children, 
  fallback = null,
  showUpgradePrompt = true,
  upgradeMessage = 'Upgrade to premium to access this feature'
}) => {
  const { hasFeature, showUpgradePrompt: showPrompt } = usePremium();
  
  const hasAccess = hasFeature(feature);
  
  if (hasAccess) {
    return children;
  }
  
  if (fallback) {
    return fallback;
  }
  
  if (!showUpgradePrompt) {
    return null;
  }
  
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-6 text-center">
      <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <StarIcon className="w-8 h-8 text-blue-600" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 mb-2">Premium Feature</h3>
      <p className="text-gray-600 mb-4">{upgradeMessage}</p>
      <button
        onClick={() => showPrompt(feature, upgradeMessage)}
        className="bg-blue-500 text-white px-6 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center space-x-2 mx-auto"
      >
        <SparklesIcon className="w-4 h-4" />
        <span>Upgrade Now</span>
      </button>
    </div>
  );
};

export default PremiumFeature; 