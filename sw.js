const CACHE_NAME = 'halfhalf-cache-1.1.0';
const LOCAL_ASSETS = [
  './',
  './index.html',
  './icon.svg',
  './icon-solid.png',
  './manifest.json'
];
const EXTERNAL_ASSETS = [
  'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Inter:wght@300;400;500;600;700&display=swap',
  'https://unpkg.com/lucide@0.469.0'
];

// Install Event: local shell is required, external assets are best-effort
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(LOCAL_ASSETS);
      await Promise.allSettled(EXTERNAL_ASSETS.map((url) => cache.add(url)));
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((names) => Promise.all(
        names.filter((name) => name !== CACHE_NAME).map((name) => caches.delete(name))
      ))
      .then(() => self.clients.claim())
  );
});

function cacheResponse(request, response) {
  if (response && (response.ok || response.type === 'opaque')) {
    const copy = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
  }
  return response;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  if (url.origin === self.location.origin) {
    // Same-origin: network first so deploys show up immediately, cache when offline
    event.respondWith(
      fetch(request)
        .then((response) => cacheResponse(request, response))
        .catch(async () => {
          const cached = await caches.match(request, { ignoreSearch: true });
          if (cached) return cached;
          if (request.mode === 'navigate') return caches.match('./index.html');
          return Response.error();
        })
    );
    return;
  }

  // Cross-origin (fonts, Lucide): cache first, refresh in the background
  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request).then((response) => cacheResponse(request, response));
      if (cached) {
        network.catch(() => {});
        return cached;
      }
      return network;
    })
  );
});
