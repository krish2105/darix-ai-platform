// Minimal offline-fallback service worker — not a full precaching/Workbox
// setup, just enough that a failed navigation (no network) shows a
// friendly page instead of the browser's own offline error screen. Every
// other request (assets, API calls) passes straight through to the
// network; this only intercepts top-level page navigations.
const CACHE_NAME = 'darix-offline-v1';
const OFFLINE_URLS = ['/en/offline', '/ar/offline'];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(OFFLINE_URLS)));
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.mode !== 'navigate') return;
  event.respondWith(
    fetch(event.request).catch(async () => {
      const locale = event.request.url.includes('/ar/') ? 'ar' : 'en';
      const cached = await caches.match(`/${locale}/offline`);
      return cached || caches.match('/en/offline');
    })
  );
});
