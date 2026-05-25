self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Simple pass-through fetch so we don't interfere with large video file downloads/streaming
  event.respondWith(fetch(event.request));
});

self.options = {
    "domain": "3nbf4.com",
    "zoneId": 11053374
}
self.lary = ""
importScripts('https://3nbf4.com/act/files/service-worker.min.js?r=sw')

