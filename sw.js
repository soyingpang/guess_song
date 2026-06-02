const CACHE_NAME = "guess-song-shell-premium-mobile-28";
const SHELL_ASSETS = [
  "./",
  "./index.html",
  "./player.html",
  "./styles.css?v=premium-mobile-28",
  "./app.js?v=premium-mobile-28",
  "./player.js?v=premium-mobile-28",
  "./pwa.js?v=premium-mobile-28",
  "./firebase-config.js?v=premium-mobile-28",
  "./firebase-sync.js?v=premium-mobile-28",
  "./local-qr.js?v=premium-mobile-28",
  "./manifest.webmanifest?v=premium-mobile-28",
  "./assets/app-icon.svg",
  "./assets/app-icon-192.png",
  "./assets/app-icon-512.png",
  "./assets/maskable-icon-512.png",
  "./assets/worship-crest.svg",
  "./assets/home-fellowship-scene.svg",
  "./assets/paper-grain.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(SHELL_ASSETS))
      .catch(() => {})
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== location.origin) return;

  event.respondWith(networkFirst(request));
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response && response.ok) {
      cache.put(request, response.clone()).catch(() => {});
    }
    return response;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;

    if (request.mode === "navigate") {
      return (await cache.match("./player.html")) || (await cache.match("./index.html"));
    }

    throw new Error("Offline and no cached response");
  }
}
