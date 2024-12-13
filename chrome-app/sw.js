const CACHE_NAME = "hidriv-v1";
const ASSETS_TO_CACHE = [
  "/",
  "/html/application.html",
  "/css/open-sans.css",
  "/css/timing.css",
  "/vendors/jquery.min.js",
  "/vendors/jquery-ui.min.js",
  "/vendors/underscore.min.js",
  "/lib/lib.js",
  "/lib/domFileStorage.js",
  "/lib/domFileStorageExt.js",
  "/lib/appComponents.js",
  "/code/storage.js",
  "/code/timing.js",
  "/js/static.js",
  "/js/views.js",
  "/js/dataTemplate.js",
  "/js/application.js",
  "/js/application_load.js",
  "/imgs/top_bar_logo.png",
  "/imgs/entry_logo.png",
  // Add all other assets that need to be cached
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        return (
          response ||
          fetch(event.request).then((response) => {
            // Cache new responses for future offline use
            return caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, response.clone());
              return response;
            });
          })
        );
      })
      .catch(() => {
        // Return offline fallback if both cache and network fail
        return new Response("You are offline");
      })
  );
});

// Clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
