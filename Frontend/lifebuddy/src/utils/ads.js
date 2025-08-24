/**
 * Loads Google AdSense script dynamically
 * @returns {Promise<void>}
 */
export const loadAdSenseScript = () => {
  return new Promise((resolve, reject) => {
    if (window.adsbygoogle) {
      resolve();
      return;
    }
    
    const script = document.createElement('script');
    script.async = true;
    script.src = "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-7023789007176202";
    script.crossOrigin = "anonymous";
    script.onload = () => resolve();
    script.onerror = (err) => reject(new Error('Failed to load AdSense'));
    
    document.head.appendChild(script);
  });
};
