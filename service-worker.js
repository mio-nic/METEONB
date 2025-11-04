// Nome della cache — aggiorna questo numero ogni volta che pubblichi
const CACHE_NAME = 'meteonb-v1.0.6';

// File da cache-are (aggiungi qui tutti i tuoi file statici)
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
  console.log('[SW] Installazione...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting()) // attiva subito il nuovo SW
  );
});

// Attivazione: elimina cache vecchie
self.addEventListener('activate', event => {
  console.log('[SW] Attivazione e pulizia cache vecchie...');
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[SW] Eliminata cache:', key);
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Intercetta richieste di rete
self.addEventListener('fetch', event => {
  // Ignora chiamate dinamiche (API)
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request).then(networkResponse => {
        if (!networkResponse || networkResponse.status !== 200) return networkResponse;
        const clonedResponse = networkResponse.clone();
        caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, clonedResponse);
        });
        return networkResponse;
      });
    }).catch(() => caches.match('/index.html')) // fallback offline
  );
});






