const OFFLINE_URL = '/offline.html';

const RESOURCES_TO_PRECACHE = [
  '/',
  '/index.html',
  '/offline.html',
  '/css/styles.css',
  '/js/script.js',
  '/manifest.json',
  '/fonts/SpaceGrotesk-VariableFont_wght.ttf',
  '/favicons/favicon.ico',
  '/favicons/android-chrome-192x192.png',
  '/favicons/android-chrome-512x512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('blahaj-cache')
      .then(cache => {
        return cache.addAll(RESOURCES_TO_PRECACHE);
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', event => {
  if (event.request.url.includes('transgirl.wamellow.com')) {
    return;
  }

  event.respondWith(
    caches.match(event.request)
      .then(cachedResponse => {
        if (cachedResponse) {
          return cachedResponse;
        }

        return fetch(event.request)
          .catch(() => {
            if (event.request.mode === 'navigate') {
              return caches.match(OFFLINE_URL);
            }
          });
      })
  );
});