const CACHE_NAME = "guess-song-shell-onsite-v3";
const SHELL_ASSETS = [
  "./",
  "./solo.html",
  "./index.html",
  "./player.html",
  "./styles.css?v=onsite-v3",
  "./player.css?v=onsite-v3",
  "./app.js?v=onsite-v3",
  "./game-core.js?v=onsite-v3",
  "./player.js?v=onsite-v3",
  "./guess-song-config.js?v=nas-solo-1",
  "./solo.js?v=nas-solo-1",
  "./pwa.js?v=onsite-v3",
  "./firebase-config.js?v=onsite-v3",
  "./firebase-sync.js?v=onsite-v3",
  "./local-qr.js?v=onsite-v3",
  "./manifest.webmanifest?v=onsite-v3",
  "./songlists/pop-cantonese.json",
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
      return (await cache.match("./solo.html")) || (await cache.match("./player.html")) || (await cache.match("./index.html"));
    }

    throw new Error("Offline and no cached response");
  }
}
