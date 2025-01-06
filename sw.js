const CACHE_NAME = 'docuscan-v1';

// Add whichever assets you want to pre-cache here
const PRECACHE_ASSETS = [
  '/',
  '/index.html',
  '/public/manifest.json',
  '/yolov11n_web_model/model.json',
  '/yolov11n_web_model/group1-shard1of1.bin'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(PRECACHE_ASSETS.map(url => new Request(url, {credentials: 'same-origin'})));
      })
      .catch((err) => {
        console.error('Failed to cache assets:', err);
      })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
      .catch((err) => {
        console.error('Fetch error:', err);
        // You might want to return a custom offline page here
      })
  );
}); 
