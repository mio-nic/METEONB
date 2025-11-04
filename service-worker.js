const APP_VERSION = '1.1.5'; // Aggiorna qui la versione
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

// Installazione: cache iniziale
self.addEventListener('install', event => {
  console.log('[SW] Installazione versione:', APP_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting()) // forza attivazione immediata
  );
});

// Attivazione: elimina cache vecchie e invia messaggio di nuova versione
self.addEventListener('activate', event => {
  console.log('[SW] Attivazione versione:', APP_VERSION);
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map(key => key !== CACHE_NAME ? caches.delete(key) : null)
      );

      // Prende controllo immediato dei client
      await self.clients.claim();

      // Invia messaggio ai client con nuova versione
      const clientsList = await self.clients.matchAll({ includeUncontrolled: true });
      clientsList.forEach(client => {
        client.postMessage({ type: 'NEW_VERSION', version: APP_VERSION });
      });
    })()
  );
});

// Fetch: serve cache, aggiorna file modificati e forza reload se necessario
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      const cachedResponse = await cache.match(event.request);
      if (cachedResponse) {
        // Fetch in background
        fetch(event.request).then(networkResponse => {
          if (!networkResponse || networkResponse.status !== 200) return;

          const responseClone = networkResponse.clone(); // Clona subito
          // Confronta contenuti
          responseClone.text().then(newText => {
            cachedResponse.clone().text().then(oldText => {
              if (newText !== oldText) {
                console.log(`[SW] File aggiornato: ${event.request.url}`);
                // Aggiorna cache
                cache.put(event.request, networkResponse.clone());
                // Forza reload client
                self.clients.matchAll().then(clients => {
                  clients.forEach(client => client.postMessage({ type: 'RELOAD' }));
                });
              }
            });
          });
        }).catch(() => {});
        return cachedResponse;
      } else {
        // Se non in cache, fetch dalla rete e memorizza
        return fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            cache.put(event.request, networkResponse.clone());
          }
          return networkResponse;
        }).catch(() => caches.match('./index.html'));
      }
    })
  );
});
