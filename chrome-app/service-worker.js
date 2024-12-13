const CACHE_NAME = "hidriv-v1";
const urlsToCache = [
  // HTML files
  "/freetime/chrome-app/html/application.html",
  "/freetime/chrome-app/html/racers-print.html",
  "/freetime/chrome-app/html/results-print.html",
  "/freetime/chrome-app/html/results-refresh.html",

  // CSS files
  "/freetime/chrome-app/css/timing.css",
  "/freetime/chrome-app/css/dark-css.css",
  "/freetime/chrome-app/css/light-css.css",
  "/freetime/chrome-app/css/open-sans.css",
  "/freetime/chrome-app/css/print.css",

  // JavaScript files
  "/freetime/chrome-app/js/application.js",
  "/freetime/chrome-app/js/application_load.js",
  "/freetime/chrome-app/js/views.js",
  "/freetime/chrome-app/js/static.js",
  "/freetime/chrome-app/js/dataTemplate.js",
  "/freetime/chrome-app/js/print-racers-inline.js",
  "/freetime/chrome-app/js/print-results-inline.js",
  "/freetime/chrome-app/js/refresh-results-inline.js",

  // Library files
  "/freetime/chrome-app/lib/lib.js",
  "/freetime/chrome-app/lib/domFileStorage.js",
  "/freetime/chrome-app/lib/domFileStorageExt.js",
  "/freetime/chrome-app/lib/appComponents.js",

  // Vendor files
  "/freetime/chrome-app/vendors/jquery.min.js",
  "/freetime/chrome-app/vendors/jquery-ui.min.js",
  "/freetime/chrome-app/vendors/underscore.min.js",

  // Images
  "/freetime/chrome-app/imgs/podium.png",
  "/freetime/chrome-app/imgs/settings.png",
  "/freetime/chrome-app/imgs/stopwatch.png",
  "/freetime/chrome-app/imgs/top_bar_logo.png",
  "/freetime/chrome-app/imgs/entry_logo.png",
  "/freetime/chrome-app/imgs/hidriv_logo.png",
  "/freetime/chrome-app/imgs/hidriv-chromelogo-128.png",
  "/freetime/chrome-app/imgs/hidriv-chromelogo-192.png",
  "/freetime/chrome-app/imgs/hidriv-chromelogo-512.png",
  "/freetime/chrome-app/imgs/hidriv-desktop.png",
  "/freetime/chrome-app/imgs/hidriv-mobile.png",
  "/freetime/chrome-app/imgs/bell_rollover.png",
  "/freetime/chrome-app/imgs/rollover_globe.png",
  "/freetime/chrome-app/imgs/trash_small.png",
  "/freetime/chrome-app/imgs/flag.png",
  "/freetime/chrome-app/imgs/group.png",

  // Fonts
  "/freetime/chrome-app/assets/OpenSans-Regular.ttf",
  "/freetime/chrome-app/assets/OpenSans-Bold.ttf",

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
          "/freetime/chrome-app/html/application.html",
          "/freetime/chrome-app/css/timing.css",
          "/freetime/chrome-app/js/application.js",
          "/freetime/chrome-app/vendors/jquery.min.js",
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
