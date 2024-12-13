const CACHE_NAME = "hidriv-v1";
const urlsToCache = [
  "/",
  "/html/application.html",
  "/css/timing.css",
  "/css/dark-css.css",
  "/js/application.js",
  "/js/views.js",
  "/js/static.js",
  "/js/dataTemplate.js",
  "/js/application_load.js",
  "/lib/lib.js",
  "/lib/domFileStorage.js",
  "/lib/appComponents.js",
  "/imgs/podium.png",
  "/imgs/settings.png",
  "/imgs/stopwatch.png",
  "/imgs/hidriv-chromelogo-128.png",
  "/manifest.json",
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
