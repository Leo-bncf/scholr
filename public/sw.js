// Self-destructing service worker.
//
// This app does not use a service worker. One was registered at some point in
// the past — most likely by the base44 build — and a registered worker stays
// installed and keeps serving its own cache long after the code that created
// it is gone. That is why a deploy can go out correctly and someone still sees
// the old site hours later, with no way to fix it but clearing site data.
//
// Serving this file at /sw.js replaces any such worker with one whose only job
// is to remove itself and everything it cached, then reload the page once.
// Deleting the file instead would not work: the catch-all would return the SPA
// shell with an HTML content type, the update would fail, and the old worker
// would survive.
//
// Leave this in place. It costs one request and it is the only thing that can
// reach a browser we do not control.
self.addEventListener('install', () => self.skipWaiting());

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) await caches.delete(key);
    await self.registration.unregister();
    for (const client of await self.clients.matchAll({ type: 'window' })) {
      client.navigate(client.url);
    }
  })());
});
