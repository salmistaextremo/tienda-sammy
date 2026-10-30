// Versión 2 del caché. Si haces cambios grandes en el futuro, cámbialo a v3, v4, etc.
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

// 1. INSTALACIÓN: Guarda los archivos estáticos en la memoria
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
  self.skipWaiting(); // Fuerza a la nueva versión a activarse de inmediato
});

// 2. ACTIVACIÓN: Borra las versiones viejas de la memoria (como la v1)
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log('Borrando caché antiguo:', cache);
            return caches.delete(cache); 
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. INTERCEPTOR DE RED (La Magia)
self.addEventListener('fetch', event => {
  // Si el cliente está pidiendo una página HTML (navegando)
  if (event.request.mode === 'navigate' || (event.request.method === 'GET' && event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html'))) {
    event.respondWith(
      fetch(event.request) // Intenta buscar en internet primero (Network First)
        .then(response => {
          // Si hay internet, guarda una copia nueva y muestra la página actualizada
          return caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, response.clone());
            return response;
          });
        })
        .catch(() => {
          // Si no hay internet (offline), muestra la copia guardada
          return caches.match(event.request);
        })
    );
  } else {
    // Para imágenes, fuentes, etc. Busca en caché primero (Cache First)
    event.respondWith(
      caches.match(event.request).then(response => {
        return response || fetch(event.request);
      })
    );
  }
});
