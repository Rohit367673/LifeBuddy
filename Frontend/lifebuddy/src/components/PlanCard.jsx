import { CheckIcon, XMarkIcon, StarIcon, LockClosedIcon } from '@heroicons/react/24/outline';

const PlanCard = ({ plan, currentPlan, onSubscribe, onStartTrial }) => {
  const isCurrentPlan = currentPlan === plan.id;
  const isFreePlan = plan.id === 'free';

  const getButtonVariant = () => {
    if (isCurrentPlan) return 'secondary';
    if (isFreePlan) return 'outline';
    return plan.buttonVariant || 'primary';
  };

  const getButtonText = () => {
    if (isCurrentPlan) return 'Current Plan';
    if (isFreePlan) return 'Get Started';
    return plan.buttonText;
  };

  const handleButtonClick = () => {
    if (isCurrentPlan) return;
    if (isFreePlan) {
      // For free plan, just redirect to dashboard or show upgrade prompt
      return;
    }
    onSubscribe(plan.id);
  };

  return (
    <div className={`relative bg-white dark:bg-gray-800 rounded-xl shadow-lg border-2 transition-all duration-300 hover:shadow-xl ${
      plan.popular 
        ? 'border-blue-500 scale-105 z-10' 
        : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
    } ${isCurrentPlan ? 'ring-2 ring-green-500' : ''}`}>
      
      {/* Popular Badge */}
      {plan.popular && (
        <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-medium shadow-lg">
            <StarIcon className="h-4 w-4 inline mr-1" />
            Most Popular
          </div>
        </div>
      )}

      {/* Savings Badge */}
      {plan.savings && (
        <div className="absolute -top-3 -right-3">
          <div className="bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium">
            {plan.savings}
          </div>
        </div>
      )}

      <div className="p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
            {plan.name}
          </h3>
          <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
            {plan.description}
          </p>
          
          {/* Price */}
          <div className="mb-4">
            <div className="text-3xl font-bold text-gray-900 dark:text-white">
              ${plan.price}
              {plan.period !== 'forever' && (
                <span className="text-lg text-gray-500 dark:text-gray-400">
                  /{plan.period}
                </span>
              )}
            </div>
            {plan.period === 'forever' && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Forever free
              </div>
            )}
          </div>
        </div>

        {/* Features */}
        <div className="space-y-3 mb-6">
          {plan.features.map((feature, index) => (
            <div key={index} className="flex items-start">
              <CheckIcon className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
              <span className="text-gray-700 dark:text-gray-300 text-sm">
                {feature}
              </span>
            </div>
          ))}
          
          {plan.limitations && plan.limitations.map((limitation, index) => (
            <div key={index} className="flex items-start">
              <XMarkIcon className="h-5 w-5 text-red-500 mr-3 mt-0.5 flex-shrink-0" />
              <span className="text-gray-500 dark:text-gray-400 text-sm">
                {limitation}
              </span>
            </div>
          ))}
        </div>

        {/* Action Button */}
        <button
          onClick={handleButtonClick}
          disabled={isCurrentPlan}
          className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
            isCurrentPlan
              ? 'bg-green-100 text-green-700 border-2 border-green-300 cursor-default'
              : isFreePlan
              ? 'bg-gray-100 text-gray-700 border-2 border-gray-300 hover:bg-gray-200'
              : plan.popular
              ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg'
              : 'bg-blue-500 text-white hover:bg-blue-600'
          }`}
        >
          {isCurrentPlan && <CheckIcon className="h-4 w-4 inline mr-2" />}
          {getButtonText()}
        </button>

        {/* Trial Info */}
        {!isFreePlan && !isCurrentPlan && (
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
            Start with 7-day free trial
          </p>
        )}
      </div>
    </div>
  );
};

export default PlanCard; 