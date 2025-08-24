import React, { useEffect, useState } from 'react';

const AdManager = ({ user, promoActive }) => {
  const [adInitialized, setAdInitialized] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return; // Skip on server
    
    // Conditions for showing ads
    const shouldShowAd = user && !user.isPremium && user.consentGiven && !promoActive;
    
    if (!shouldShowAd) {
      // Cleanup if conditions change
      if (adInitialized) {
        // Remove any existing ad containers
        const adContainers = document.querySelectorAll('.adsbygoogle');
        adContainers.forEach(container => container.remove());
        setAdInitialized(false);
      }
      return;
    }
    
    // Inject AdSense script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${import.meta.env.VITE_ADSENSE_CLIENT}`;
    script.crossOrigin = "anonymous";
    
    script.onload = () => {
      window.adsbygoogle = window.adsbygoogle || [];
      try {
        window.adsbygoogle.push({});
        setAdInitialized(true);
      } catch (err) {
        console.error('AdSense push error:', err);
      }
    };
    
    script.onerror = () => {
      console.error('Failed to load AdSense script');
    };
    
    document.head.appendChild(script);
    
    return () => {
      // Cleanup script
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
      // Remove ad containers
      const adContainers = document.querySelectorAll('.adsbygoogle');
      adContainers.forEach(container => container.remove());
      setAdInitialized(false);
    };
  }, [user, promoActive]);

  if (!user || user.isPremium || !user.consentGiven || promoActive) {
    return null;
  }

  return (
    <div className="ad-container">
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={import.meta.env.VITE_ADSENSE_CLIENT}
        data-ad-slot={import.meta.env.VITE_ADSENSE_SLOT}
        data-ad-format="auto"
        data-full-width-responsive="true"
      ></ins>
    </div>
  );
};

export default AdManager;
