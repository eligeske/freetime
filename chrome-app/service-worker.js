const CACHE_NAME = "hidriv-v1";
const urlsToCache = [
  "/freetime/chrome-app/html/racers-print.html",
  "/freetime/chrome-app/html/results-print.html",
  "/freetime/chrome-app/html/application.html",
  "/freetime/chrome-app/css/timing.css",
  "/freetime/chrome-app/css/dark-css.css",
  "/freetime/chrome-app/js/application.js",
  "/freetime/chrome-app/js/views.js",
  "/freetime/chrome-app/js/static.js",
  "/freetime/chrome-app/js/dataTemplate.js",
  "/freetime/chrome-app/js/application_load.js",
  "/freetime/chrome-app/lib/lib.js",
  "/freetime/chrome-app/lib/domFileStorage.js",
  "/freetime/chrome-app/lib/appComponents.js",
  "/freetime/chrome-app/imgs/podium.png",
  "/freetime/chrome-app/imgs/settings.png",
  "/freetime/chrome-app/imgs/stopwatch.png",
  "/freetime/chrome-app/imgs/hidriv-chromelogo-128.png",
  "/freetime/chrome-app/manifest.json",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches
      .match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
