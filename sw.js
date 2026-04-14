const CACHE_NAME = 'zengarden-v3'; // Incremented version
const ASSETS = [
    './',
    './index.html',
    './style.css',
    './script.js',
    './manifest.json',
    './icon-192.png',
    './icon-512.png',
    'https://cdn.jsdelivr.net/npm/chart.js'
];

// Install Service Worker
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('ZenGarden: Caching all assets');
            // Using return here ensures the installation waits until caching is done
            return cache.addAll(ASSETS);
        })
    );
});

// Activate and remove old caches
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((keys) => {
            return Promise.all(keys
                .filter(key => key !== CACHE_NAME)
                .map(key => caches.delete(key))
            );
        })
    );
});

// Fetch events for offline support
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request).then((cachedResponse) => {
            // Return the cached version if it exists, otherwise fetch from network
            return cachedResponse || fetch(event.request);
        }).catch(() => {
            // Fallback if both fail (e.g., user is offline and asset isn't cached)
            if (event.request.mode === 'navigate') {
                return caches.match('./index.html');
            }
        })
    );
});
