import React, { useEffect, useState, useRef } from 'react';
import { loadAdSenseScript, pushAd } from '../utils/ads';

const AdManager = ({ user, promoActive }) => {
  const [adInitialized, setAdInitialized] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return; // Skip on server
    if (!import.meta.env.PROD) return; // Only load/show in production
    
    // Conditions for showing ads
    const shouldShowAd = user && !user.isPremium && user.consentGiven && !promoActive;
    
    if (!shouldShowAd) {
      // Cleanup if conditions change
      if (adInitialized) {
        // Remove only ads within this component's container
        const root = containerRef.current;
        if (root) {
          const adContainers = root.querySelectorAll('.adsbygoogle');
          adContainers.forEach(container => container.remove());
        }
        setAdInitialized(false);
      }
      return;
    }
    
    // Load AdSense via shared utility (no-ops if already present)
    loadAdSenseScript()
      .then(() => {
        try {
          pushAd();
          setAdInitialized(true);
        } catch (err) {
          console.error('AdSense push error:', err);
        }
      })
      .catch(() => {
        // Non-fatal, skip ads
      });
    
    return () => {
      // Remove only this component's ad containers
      const root = containerRef.current;
      if (root) {
        const adContainers = root.querySelectorAll('.adsbygoogle');
        adContainers.forEach(container => container.remove());
      }
      setAdInitialized(false);
    };
  }, [user, promoActive]);

  if (!import.meta.env.PROD) return null;
  if (!user || user.isPremium || !user.consentGiven || promoActive) {
    return null;
  }

  return (
    <div className="ad-container" ref={containerRef}>
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
