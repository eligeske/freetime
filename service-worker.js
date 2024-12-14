const CACHE_NAME = "hidriv-v1";
const urlsToCache = [
  // HTML files
  "/html/application.html",
  "/html/racers-print.html",
  "/html/results-print.html",
  "/html/results-refresh.html",

  // CSS files
  "/css/timing.css",
  "/css/dark-css.css",
  "/css/light-css.css",
  "/css/open-sans.css",
  "/css/print.css",

  // JavaScript files
  "/js/application.js",
  "/js/application_load.js",
  "/js/views.js",
  "/js/static.js",
  "/js/dataTemplate.js",
  "/js/print-racers-inline.js",
  "/js/print-results-inline.js",
  "/js/refresh-results-inline.js",

  // Library files
  "/lib/lib.js",
  "/lib/domFileStorage.js",
  "/lib/domFileStorageExt.js",
  "/lib/appComponents.js",

  // Vendor files
  "/vendors/jquery.min.js",
  "/vendors/jquery-ui.min.js",
  "/vendors/underscore.min.js",

  // Images
  "/imgs/podium.png",
  "/imgs/settings.png",
  "/imgs/stopwatch.png",
  "/imgs/top_bar_logo.png",
  "/imgs/entry_logo.png",
  "/imgs/hidriv_logo.png",
  "/imgs/hidriv-chromelogo-128.png",
  "/imgs/hidriv-chromelogo-192.png",
  "/imgs/hidriv-chromelogo-512.png",
  "/imgs/hidriv-desktop.png",
  "/imgs/hidriv-mobile.png",
  "/imgs/bell_rollover.png",
  "/imgs/rollover_globe.png",
  "/imgs/trash_small.png",
  "/imgs/flag.png",
  "/imgs/group.png",

  // Fonts
  "/assets/OpenSans-Regular.ttf",
  "/assets/OpenSans-Bold.ttf",

  // Root files
  "/freetime/manifest.json",
  "/freetime/index.html",
];

self.addEventListener("install", (event) => {
  self.skipWaiting();

  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.all([
        cache.addAll([
          "/html/application.html",
          "/css/timing.css",
          "/js/application.js",
          "/vendors/jquery.min.js",
        ]),
        cache.addAll(urlsToCache),
      ]);
    })
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.url.endsWith(".html")) {
    event.respondWith(
      fetch(event.request).catch(() => caches.match(event.request))
    );
    return;
  }

  event.respondWith(
    caches
      .match(event.request)
      .then((response) => response || fetch(event.request))
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
