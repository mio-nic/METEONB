// 🧩 Nome della cache — cambia numero a ogni rilascio per forzare update
const CACHE_NAME = 'meteonb-v3';  

// 🗂️ File da mettere in cache (aggiungi i tuoi file qui)
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/style.css',
  '/main.js',
  '/vita.js',
  '/manifest.json',
  '/favicon.ico',
  // Aggiungi altre cartelle o file
  '/notizie/notizie.html',
  '/pre/pre.html'
];

// 🪣 Installazione: salva in cache i file essenziali
self.addEventListener('install', event => {
  console.log('[ServiceWorker] Installando nuova versione...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS_TO_CACHE))
      .then(() => self.skipWaiting()) // forza l’attivazione subito
  );
});

// 🧹 Attivazione: elimina le cache vecchie
self.addEventListener('activate', event => {
  console.log('[ServiceWorker] Attivato. Pulizia cache vecchie...');
  event.waitUntil(
    caches.keys().then(keys => 
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log('[ServiceWorker] Eliminata cache vecchia:', key);
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim()) // forza l’uso immediato del nuovo SW
  );
});

// ⚡ Gestione delle richieste di rete
self.addEventListener('fetch', event => {
  // Evita di cacheare chiamate dinamiche tipo API
  if (event.request.url.includes('/api/')) return;

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // Se il file è già in cache, lo usa
        if (response) return response;

        // Altrimenti lo scarica dalla rete e lo aggiunge alla cache
        return fetch(event.request).then(networkResponse => {
          if (!networkResponse || networkResponse.status !== 200) {
            return networkResponse;
          }
          const clonedResponse = networkResponse.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, clonedResponse);
          });
          return networkResponse;
        });
      })
      .catch(() => caches.match('/index.html')) // fallback offline
  );
});
