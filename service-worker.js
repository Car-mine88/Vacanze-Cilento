const CACHE_NAME = 'vacanze-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json'
];

// INSTALLA IL SERVICE WORKER
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

// ATTIVA IL SERVICE WORKER
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// STRATEGIE CACHE
self.addEventListener('fetch', event => {
  // Per richieste GET, usa cache first, fallback a network
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request)
        .then(response => {
          return response || fetch(event.request);
        })
        .catch(() => {
          return caches.match('/index.html');
        })
    );
  }
});
