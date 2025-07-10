import { usePremium } from '../context/PremiumContext';
import { StarIcon, SparklesIcon } from '@heroicons/react/24/outline';

const UsageLimitBanner = ({ limitType, current, limit, onUpgrade }) => {
  const { showUpgradePrompt } = usePremium();
  
  const getLimitMessage = () => {
    const messages = {
      activeEvents: 'You\'ve reached your event limit. Upgrade to create unlimited events!',
      dailyTasks: 'You\'ve reached your daily task limit. Upgrade for unlimited tasks!',
      moodEntries: 'You\'ve reached your mood history limit. Upgrade for full history!'
    };
    return messages[limitType] || 'You\'ve reached your limit. Upgrade for unlimited access!';
  };

  const getProgressColor = () => {
    const percentage = (current / limit) * 100;
    if (percentage >= 90) return 'bg-red-500';
    if (percentage >= 75) return 'bg-yellow-500';
    return 'bg-blue-500';
  };

  const percentage = Math.min((current / limit) * 100, 100);

  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-blue-200 rounded-lg p-4 mb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <StarIcon className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Usage Limit Reached</h3>
            <p className="text-sm text-gray-600">{getLimitMessage()}</p>
          </div>
        </div>
        <button
          onClick={() => showUpgradePrompt(limitType, getLimitMessage())}
          className="bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition-colors flex items-center space-x-2"
        >
          <SparklesIcon className="w-4 h-4" />
          <span>Upgrade</span>
        </button>
      </div>
      
      <div className="mt-3">
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>{limitType.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</span>
          <span>{current}/{limit}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
            style={{ width: `${percentage}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default UsageLimitBanner; 