const CACHE_NAME = 'projectzg-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/login.html',
  '/signup.html',
  '/home.html',
  '/feeds.html',
  '/profile.html',
  '/search.html',
  '/settings.html',
  '/editprofile.html',
  '/createpost.html',
  '/notifications.html',
  '/css/styles.css',
  '/css/login.css',
  '/css/feeds.css',
  '/css/settings.css',
  '/css/createpost.css',
  '/js/api.js',
  '/js/supabaseClient.js',
  '/js/authCheck.js',
  '/js/login.js',
  '/js/home.js',
  '/js/feeds.js',
  '/js/profile.js',
  '/js/settings.js',
  '/js/createpost.js',
  '/image/communityicon.png',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('[Service Worker] Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[Service Worker] Caching app shell');
        return cache.addAll(urlsToCache.map(url => new Request(url, {cache: 'reload'})))
          .catch((err) => {
            console.error('[Service Worker] Cache addAll error:', err);
            // Continue even if some resources fail to cache
          });
      })
  );
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[Service Worker] Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[Service Worker] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin) && !event.request.url.includes('supabase')) {
    return;
  }

  // Skip API requests for fresh data
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request)
        .catch(() => {
          return new Response(
            JSON.stringify({ error: 'Offline - please check your connection' }),
            {
              headers: { 'Content-Type': 'application/json' },
              status: 503
            }
          );
        })
    );
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }

        // Clone the request
        const fetchRequest = event.request.clone();

        return fetch(fetchRequest).then((response) => {
          // Check if valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          // Cache the fetched response for future use
          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        }).catch((error) => {
          console.error('[Service Worker] Fetch error:', error);
          // Return offline page if available
          return caches.match('/index.html');
        });
      })
  );
});

// Handle messages from clients
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
