const CACHE_NAME = `lifebuddy-v${Date.now()}`;
const urlsToCache = [
  '/',
  '/index.html'
];

// Install event - cache resources and skip waiting
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  // Force the waiting service worker to become the active service worker
  self.skipWaiting();
});

// Fetch event - network first strategy to prevent white screen
self.addEventListener('fetch', (event) => {
  // Skip health check requests and API calls in service worker
  if (event.request.url.includes('/api/health') || 
      event.request.url.includes('/api/') ||
      event.request.url.includes('csp.withgoogle.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If network request succeeds, cache and return it
        if (response.status === 200) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseClone);
            });
        }
        return response;
      })
      .catch(() => {
        // Only use cache as fallback if network fails
        return caches.match(event.request);
      })
  );
});

// Activate event - clean up old caches and claim clients
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all clients immediately
      return self.clients.claim();
    })
  );
});
