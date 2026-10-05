// Replace the old preview worker, remove its caches, then reload open pages.
self.addEventListener("install", (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      await self.registration.unregister();
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)));
      const pages = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      await Promise.all(pages.map((page) => page.navigate(page.url)));
    })(),
  );
});
