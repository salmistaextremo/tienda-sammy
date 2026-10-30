// Cambiamos a v2 para forzar la actualización en todos los dispositivos
const CACHE_NAME = 'tiendas-sams-v2';
const ASSETS = [
  '/',
  '/index.html',
  '/portal.html',
  '/admin.html',
  '/info.html',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap',
  'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2',
  'https://cdn.jsdelivr.net/npm/browser-image-compression@2.0.2/dist/browser-image-compression.js'
];

// Instalar el Service Worker y guardar los archivos en caché
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting();
});

// Activar y limpiar cachés antiguos (ej. la v1)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            return caches.delete(cache); // Borra la memoria vieja
          }
        })
      );
    })
  );
  self.clients.claim();
});

// NUEVA LÓGICA: Buscar en la red primero para el HTML, luego en caché
self.addEventListener('fetch', event => {
  // Si es una página HTML, buscar primero la versión nueva en internet
  if (event.request.mode === 'navigate' || (event.request.method === 'GET' && event.request.headers.get('accept').includes('text/html'))) {
    event.respondWith(
      fetch(event.request).then(response => {
        return caches.open(CACHE_NAME).then(cache => {
          cache.put(event.request, response.clone());
          return response;
        });
      }).catch(() => {
        return caches.match(event.request);
      })
    );
  } else {
    // Para imágenes, fuentes y scripts, usar la memoria caché para que cargue rápido
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request);
      })
    );
  }
});
