import React, { useState, useEffect } from 'react';
import { daysSince } from '../utils/dates';

const PromoVideo = ({ user, onUpgrade }) => {
  const [showPromo, setShowPromo] = useState(false);
  
  useEffect(() => {
    if (!user || user.isPremium) {
      setShowPromo(false);
      return;
    }
    
    const signupDate = new Date(user.signupDate);
    const days = daysSince(signupDate);
    setShowPromo(days <= 7);
  }, [user]);
  
  if (!showPromo) {
    return null;
  }
  
  return (
    <div className="promo-video-container">
      <video 
        autoPlay 
        muted 
        controls
        className="w-full max-w-2xl mx-auto"
      >
        <source src="/promo-video.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>
      <button 
        onClick={onUpgrade}
        className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600"
      >
        Start Free Trial
      </button>
    </div>
  );
};

export default PromoVideo;
