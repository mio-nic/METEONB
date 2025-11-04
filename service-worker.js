// service-worker.js
const APP_VERSION = '1.1.2'; // Aggiorna qui la versione
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
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting())
  );
});

// Attivazione: elimina cache vecchie e invia messaggi ai client
self.addEventListener('activate', event => {
  console.log('[SW] Attivazione versione:', APP_VERSION);
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      );

      // Notifica client della versione attiva
      const clientsList = await self.clients.matchAll({ includeUncontrolled: true });
      clientsList.forEach(client => {
        client.postMessage({ type: 'VERSION', version: APP_VERSION });
      });

      await self.clients.claim();
    })()
  );
});

// Fetch: serve dalla cache, aggiorna solo file modificati
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      const cachedResponse = await cache.match(event.request);
      if (cachedResponse) {
        // Controlla aggiornamenti in background
        fetch(event.request).then(networkResponse => {
          if (networkResponse && networkResponse.status === 200) {
            cache.match(event.request).then(oldResponse => {
              networkResponse.clone().text().then(newText => {
                if (!oldResponse) {
                  cache.put(event.request, networkResponse.clone());
                  return;
                }
                oldResponse.text().then(oldText => {
                  if (oldText !== newText) {
                    console.log(`[SW] Aggiornamento file: ${event.request.url}`);
                    cache.put(event.request, networkResponse.clone());
                    // Notifica client che c'è un file aggiornato
                    self.clients.matchAll().then(clients => {
                      clients.forEach(client => client.postMessage({ type: 'RELOAD' }));
                    });
                  }
                });
              });
            });
          }
        }).catch(() => {});
        return cachedResponse;
      } else {
        // Se non è in cache, fetch dalla rete
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

