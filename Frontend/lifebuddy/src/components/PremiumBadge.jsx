import React from 'react';
import { CheckBadgeIcon } from '@heroicons/react/24/solid';

const PremiumBadge = ({ size = 'md', showTooltip = true, className = '' }) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-5 w-5',
    lg: 'h-6 w-6',
    xl: 'h-8 w-8'
  };

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <div className="group relative">
        <CheckBadgeIcon 
          className={`${sizeClasses[size]} text-blue-500 animate-pulse`}
          title={showTooltip ? "Premium Verified User" : undefined}
        />
        {showTooltip && (
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-900 rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-10">
            Premium Verified User
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PremiumBadge;

