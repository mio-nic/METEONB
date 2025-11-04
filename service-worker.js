// -----------------------------
// service-worker.js definitivo
// -----------------------------

const APP_VERSION = '1.0.4'; // Aggiorna questa versione ad ogni rilascio
const CACHE_NAME = `meteonb-${APP_VERSION}`;

// File da mettere in cache
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

// Installazione: cache iniziale
self.addEventListener('install', event => {
  console.log('[SW] Installazione versione:', APP_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting()) // forza attivazione immediata
  );
});

// Attivazione: elimina cache vecchie e invia versione al client
self.addEventListener('activate', event => {
  console.log('[SW] Attivazione versione:', APP_VERSION);
  event.waitUntil(
    (async () => {
      // Cancella cache vecchie
      const keys = await caches.keys();
      await Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Eliminata cache vecchia:', key);
            return caches.delete(key);
          }
        })
      );

      // Notifica tutti i client della versione attiva
      const clientsList = await self.clients.matchAll();
      clientsList.forEach(client => {
        client.postMessage({ type: 'VERSION', version: APP_VERSION });
      });

      await self.clients.claim(); // prende il controllo immediato delle schede
    })()
  );
});

// Gestione fetch: serve dalla cache, fallback rete
self.addEventListener('fetch', event => {
  // Ignora richieste API dinamiche
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    caches.match(event.request).then(response => {
      if (response) return response;

      return fetch(event.request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200) return networkResponse;
        const clonedResponse = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, clonedResponse);
        });
        return networkResponse;
      });
    }).catch(() => caches.match('./index.html')) // fallback offline
  );
});
