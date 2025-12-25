// Service Worker for PWA installability
// Minimal implementation - no asset caching, just enables installability

const CACHE_NAME = 'hand-warmer-v1';

// Install event - minimal setup
self.addEventListener('install', (event) => {
    // Skip waiting to activate immediately
    self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        return caches.delete(cacheName);
                    }
                })
            );
        }).then(() => {
            // Take control of all pages immediately
            return self.clients.claim();
        })
    );
});

// Fetch event - no caching, just pass through
self.addEventListener('fetch', (event) => {
    // No caching - just let requests pass through normally
    event.respondWith(fetch(event.request));
});

