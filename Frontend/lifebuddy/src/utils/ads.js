/**
 * Loads Google AdSense script dynamically, only in production.
 * Returns early on localhost/dev to comply with AdSense policies.
 */
export const loadAdSenseScript = () => {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') return resolve();
    if (!import.meta.env.PROD) return resolve();

    // If AdSense is already initialized, resolve immediately
    if (window.adsbygoogle) {
      return resolve();
    }

    // Avoid duplicate script tags
    const existing = document.querySelector('script[src*="googlesyndication.com/pagead/js/adsbygoogle.js"]');
    if (existing) return resolve();

    const client = import.meta.env.VITE_ADSENSE_CLIENT;
    if (!client) {
      // No configured client: skip loading in production too
      return resolve();
    }

    const script = document.createElement('script');
    script.async = true;
    script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${client}`;
    script.crossOrigin = 'anonymous';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load AdSense'));
    document.head.appendChild(script);
  });
};

export const pushAd = () => {
  if (typeof window === 'undefined') return;
  if (!import.meta.env.PROD) return;
  try {
    (window.adsbygoogle = window.adsbygoogle || []).push({});
  } catch (e) {
    // Silently ignore to avoid runtime disruption
  }
};
