const CACHE_NAME = 'zen-cache-v2';
const urlsToCache = [
  './',
  './index.html',
  './script.js',
  './style.css',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Add p5 files only if you are actually using them in this project version
// './p5.js',
// './p5.sound.min.js',

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version, or fetch from network
        return response || fetch(event.request);
      })
  );
});

self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheWhitelist.includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
