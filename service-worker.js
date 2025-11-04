// ⚡ Versione app
const APP_VERSION = '1.0.8'; // Aggiorna questa versione ad ogni rilascio
const CACHE_NAME = `meteonb-${APP_VERSION}`;

// 📂 File da mettere in cache
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

// 🔹 Installazione: cache iniziale
self.addEventListener('install', event => {
  console.log('[SW] Installazione versione:', APP_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting()) // forza attivazione immediata
  );
});

// 🔹 Attivazione: elimina cache vecchie
self.addEventListener('activate', event => {
  console.log('[SW] Attivazione versione:', APP_VERSION);
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Eliminata cache vecchia:', key);
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim()) // prende il controllo immediato
  );
});

// 🔹 Gestione fetch: serve dalla cache, fallback alla rete
self.addEventListener('fetch', event => {
  // Ignora chiamate dinamiche tipo API
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    caches.match(event.request).then(response => {
      // Se presente in cache, restituisce subito
      if (response) return response;

      // Altrimenti fetch e aggiorna cache
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

