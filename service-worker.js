const APP_VERSION = '1.0.13'; // Cambia qui per testare aggiornamenti
const CACHE_NAME = `meteonb-${APP_VERSION}`;
const ASSETS_TO_CACHE = [
  './index.html',
  './style.css',
  './main.js',
  './gradi.js',
  './table.js',
  './gradi-precipitazioni.js',
  './vita.js',
  './sun.js',
  './sport.js',
  './bar.js',
  './manifest.json',
];

// Installazione
self.addEventListener('install', event => {
  console.log('[SW] Installazione versione:', APP_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting()) // forza attivazione immediata
  );
});

// Attivazione
self.addEventListener('activate', event => {
  console.log('[SW] Attivazione versione:', APP_VERSION);
  event.waitUntil(
    (async () => {
      // Elimina cache vecchie
      const keys = await caches.keys();
      await Promise.all(
        keys.map(key => key !== CACHE_NAME ? caches.delete(key) : null)
      );
      await self.clients.claim();

      // Notifica i client che c'è una nuova versione
      const clientsList = await self.clients.matchAll({ includeUncontrolled: true });
      clientsList.forEach(client => {
        client.postMessage({ type: 'NEW_VERSION', version: APP_VERSION });
      });
    })()
  );
});

// Fetch
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cachedResponse => {
      return cachedResponse || fetch(event.request).then(networkResponse => {
        if (networkResponse && networkResponse.status === 200) {
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, networkResponse.clone()));
        }
        return networkResponse;
      }).catch(() => caches.match('./index.html'));
    })
  );
});
