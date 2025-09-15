const CACHE_NAME = 'helpviewer-cache-20250915';
const CACHE_FILES = [ '/LICENSE','/faviconPWA.png','/robots.txt','/hvdata/jszip.min.js','/hvdata/LICENSE-jszip.md','/hvdata/data.zip','/hvdata/appmain.js','/manifest.webmanifest','/favicon.png','/index.html' ];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(CACHE_FILES))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keyList) =>
      Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});

self.addEventListener('message', event => {
  if (event.data && event.data.action === 'clearCache') {
    caches.keys().then(keyList => {
      return Promise.all(
        keyList.map(name => caches.delete(name))
      );
    });
  }
});