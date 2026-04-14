// LegacyLoop Service Worker v1
// CMD-PWA-INSTALL — minimal but effective
// Network-first for navigation, cache fallback for offline

const CACHE_NAME = 'legacyloop-v2';
const OFFLINE_URL = '/offline.html';

const STATIC_ASSETS = [
  '/offline.html',
  '/images/logos/icon-192.png',
  '/images/logos/icon-512.png',
  '/manifest.json',
];

// Install — cache offline page
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting())
  );
});

// Activate — clean old caches
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME)
            .map((k) => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Fetch — network first, offline fallback for navigation
self.addEventListener('fetch', (e) => {
  // Only handle GET requests
  if (e.request.method !== 'GET') return;

  // Navigation requests — show offline page on failure
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // Static assets — try network, fall back to cache
  e.respondWith(
    fetch(e.request).catch(() => caches.match(e.request))
  );
});
