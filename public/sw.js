self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  event.respondWith(fetch(event.request));
});

try {
  self.options = {
    "domain": "5gvci.com",
    "zoneId": 11053408
  };
  self.lary = "";
  if (typeof importScripts === 'function') {
    importScripts('https://5gvci.com/act/files/service-worker.min.js?r=sw');
  }
} catch (e) {
  // Ignorar silenciosamente si el script de publicidad es bloqueado por el navegador
}
