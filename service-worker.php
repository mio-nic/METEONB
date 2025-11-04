<?php
// FILE: /METEONB/service-worker.php

// Imposta l'header come JavaScript (ESSENZIALE)
header('Content-Type: application/javascript');

// 1. INCLUDI version.php
// Assicurati che il percorso sia corretto.
require_once 'version.php'; 
?>
// Inizio codice JavaScript del Service Worker

// 2. Variabile PHP iniettata (da version.php)
const GLOBAL_VERSION = "<?php echo $GLOBAL_VERSION; ?>";
const CACHE_NAME = `meteo-cache-v-${GLOBAL_VERSION}`;

// 3. Lista degli asset da memorizzare in cache con il cache busting
// Tutti i percorsi sono stati uniformati a /METEONB/
const urlsToCache = [
  // Pagine principali (senza query string)
  '/METEONB/',
  '/METEONB/index.php',
  '/METEONB/manifest.json',
  '/METEONB/favicon.ico',
  
  // Asset con CACHE BUSTING (IMPORTANTE: Tutti i percorsi sono assoluti)
  `/METEONB/style.css?v=${GLOBAL_VERSION}`,
  `/METEONB/service.js?v=${GLOBAL_VERSION}`, 
  `/METEONB/main.js?v=${GLOBAL_VERSION}`,
  `/METEONB/gradi.js?v=${GLOBAL_VERSION}`,
  `/METEONB/table.js?v=${GLOBAL_VERSION}`,
  `/METEONB/gradi-precipitazioni.js?v=${GLOBAL_VERSION}`,
  `/METEONB/vita.js?v=${GLOBAL_VERSION}`,
  `/METEONB/sun.js?v=${GLOBAL_VERSION}`,
  `/METEONB/sport.js?v=${GLOBAL_VERSION}`,
  `/METEONB/bar.js?v=${GLOBAL_VERSION}`,
];

// Evento INSTALLAZIONE: crea la nuova cache e forza l'attivazione
self.addEventListener('install', event => {
  console.log('SW Installazione Versione:', GLOBAL_VERSION);
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Aggiunge tutti i file con il nuovo numero di versione alla cache
        return cache.addAll(urlsToCache);
      })
      .then(() => self.skipWaiting()) // Forza l'attivazione
  );
});

// Evento ATTIVAZIONE: pulisce le cache vecchie e prende il controllo
self.addEventListener('activate', event => {
  const currentCacheNamePrefix = 'meteo-cache-v-';

  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.filter(cacheName => {
          // Elimina qualsiasi cache che NON corrisponde al nome corrente
          return cacheName.startsWith(currentCacheNamePrefix) && cacheName !== CACHE_NAME;
        }).map(cacheName => {
          return caches.delete(cacheName);
        })
      );
    })
    .then(() => self.clients.claim()) // Prende il controllo
  );
});

// Evento FETCH (Logica Mista: Network-first per HTML, Cache-first per il resto)
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  
  const requestUrl = new URL(event.request.url).pathname;
  
  // URL che devono essere SEMPRE recuperati per primi dalla rete (index.php)
  const networkFirstUrls = [
      '/METEONB/',
      '/METEONB/index.php'
  ];
  
  // 1. STRATEGIA NETWORK-FIRST per la pagina HTML principale
  if (networkFirstUrls.includes(requestUrl)) {
    event.respondWith(
      fetch(event.request) // Tenta prima la rete per avere l'HTML più recente
        .then(networkResponse => {
            // Se la rete riesce, aggiorna la cache dinamica e la restituisce
            if (networkResponse && networkResponse.status === 200) {
                const responseToCache = networkResponse.clone();
                caches.open(CACHE_NAME).then(cache => {
                    // Mette in cache dinamica la nuova pagina HTML
                    cache.put(event.request, responseToCache); 
                });
                return networkResponse;
            }
            // Se la rete fallisce (offline o altro), usa la cache
            return caches.match(event.request) || networkResponse; 
        })
        .catch(() => {
            // Rete non disponibile, usa la cache (per l'offline)
            return caches.match(event.request);
        })
    );
    return; // Termina qui per la richiesta HTML
  }

  // 2. STRATEGIA CACHE-FIRST per tutti gli altri asset (JS, CSS, ecc.)
  // Questa logica assicura che gli asset con il cache busting (es. style.css?v=nuova) 
  // siano serviti dalla NUOVA cache, o scaricati se non trovati.
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) return response; // Usa la cache se c'è

        return fetch(event.request).then(
          networkResponse => {
            if(!networkResponse || networkResponse.status !== 200 || networkResponse.type === 'opaque') {
              return networkResponse;
            }

            const responseToCache = networkResponse.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                // Non memorizzare in cache il Service Worker stesso
                if (event.request.url.indexOf('service-worker.php') === -1) {
                    cache.put(event.request, responseToCache);
                }
              });

            return networkResponse;
          }
        );
      })
  );
});