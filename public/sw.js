const CACHE_NAME = 'milk-blog-cache-v1';

// Install event: speed up activation
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/manifest.json'
      ]).catch(err => console.log('Pre-caching skipped files:', err));
    })
  );
  self.skipWaiting();
});

// Activate event: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event: Network-first falling back to cache for static assets.
// We exclude API calls because we cache API responses manually on the client side inside localStorage,
// which is a much more robust and controllable way for JSON content!
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Bypass POST requests and API endpoints (since we use localStorage for offline blog content)
  if (event.request.method !== 'GET' || url.pathname.startsWith('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        // If valid response, clone and cache it
        if (response && response.status === 200 && response.type === 'basic') {
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Fall back to cache on failure (offline)
        return caches.match(event.request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          // If we can't find anything, return index.html for navigation requests
          if (event.request.mode === 'navigate') {
            return caches.match('/index.html');
          }
        });
      })
  );
});
