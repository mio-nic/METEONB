const APP_VERSION = '1.0.12'; // Aggiorna qui per testare nuove versioni

// Installazione: solo log, nessuna cache
self.addEventListener('install', event => {
  console.log('[SW] Installato versione:', APP_VERSION);
  self.skipWaiting(); // forza attivazione immediata
});

// Attivazione: log e notifica i client
self.addEventListener('activate', event => {
  console.log('[SW] Attivato versione:', APP_VERSION);
  self.clients.claim(); // prende controllo subito

  // Notifica tutti i client della versione corrente
  self.clients.matchAll({ includeUncontrolled: true }).then(clients => {
    clients.forEach(client => {
      client.postMessage({ type: 'NEW_VERSION', version: APP_VERSION });
    });
  });
});

// Fetch: passa sempre al network (nessuna cache)
self.addEventListener('fetch', event => {
  event.respondWith(fetch(event.request));
});
