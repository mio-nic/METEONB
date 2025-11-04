// service-worker.js
const FILES_TO_CHECK = [
  '/index.html',
  '/main.js',
  '/vita.js',
  '/style.css'
];

// Installazione & attivazione
self.addEventListener('install', event => self.skipWaiting());
self.addEventListener('activate', event => self.clients.claim());

// Controllo aggiornamenti
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (FILES_TO_CHECK.includes(url.pathname)) {
    event.respondWith(
      fetch(event.request).then(networkResponse => {
        // Notifica il client che un file è cambiato
        self.clients.matchAll().then(clients =>
          clients.forEach(client =>
            client.postMessage({ type: 'FILE_UPDATED', url: url.pathname })
          )
        );
        return networkResponse;
      }).catch(() => caches.match(event.request))
    );
  }
});
