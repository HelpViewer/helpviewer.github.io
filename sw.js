const CACHE_NAME = 'helpviewer-cache-20260809';
const CACHE_FILES = [ '/favicon.png','/faviconPWA.png','/robots.txt','/index.html','/hvdata/data.zip','/hvdata/jszip.min.js','/hvdata/LICENSE-jszip.md','/hvdata/index.html','/hvdata/appmain.js','/LICENSE','/manifest.webmanifest' ];

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