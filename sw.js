const CACHE_NAME = 'helpviewer-cache-v1';
const CACHE_FILES = [ '/robots.txt','/manifest.webmanifest','/index.html','/hvdata/jszip.min.js','/hvdata/appmain.js','/hvdata/LICENSE-jszip.md','/hvdata/data.zip','/faviconPWA.png','/favicon.png' ];

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