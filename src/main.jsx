import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/App.jsx'
import '@/index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <App />
)

/**
 * Evict any service worker and cache left over from a previous incarnation of
 * this app.
 *
 * Scholr does not use a service worker. One was registered at some point —
 * most likely by the base44 build — and a registered worker keeps serving its
 * own cache indefinitely: a deploy goes out correctly and the user still sees
 * the old site, with no way to fix it but clearing site data by hand.
 *
 * Serving a self-destructing worker at /sw.js only reaches a worker registered
 * at that exact URL. This reaches every one of them, whatever their scope, the
 * moment the app runs. It is a few lines and it costs nothing once there is
 * nothing left to unregister.
 *
 * Safe to delete once we are confident no user is still carrying one — but
 * there is no way to know that, so it stays.
 */
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations()
    .then(async (registrations) => {
      if (registrations.length === 0) return;
      await Promise.all(registrations.map(r => r.unregister()));
      if (window.caches) {
        for (const key of await caches.keys()) await caches.delete(key);
      }
      // Reload once so the page is served from the network rather than from
      // the cache the worker was still answering with.
      if (!sessionStorage.getItem('sw-evicted')) {
        sessionStorage.setItem('sw-evicted', '1');
        window.location.reload();
      }
    })
    .catch(() => { /* nothing registered, or the API is unavailable */ });
}
