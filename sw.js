const CACHE_NAME = 'halfhalf-cache-1.2.0';
const LOCAL_ASSETS = [
  './',
  './index.html',
  './style.css',
  './calc.js',
  './app.js',
  './fonts/inter-latin.woff2',
  './fonts/instrument-serif-latin.woff2',
  './icon.svg',
  './icon-solid.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './manifest.json'
];

// Install Event: everything is same-origin now, so precache the whole shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(LOCAL_ASSETS))
      .then(() => self.skipWaiting())
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

// Same-origin only: network first so deploys show up immediately, cache when offline
self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;

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
});
