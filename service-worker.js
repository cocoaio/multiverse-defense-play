const CACHE_NAME = "multiverse-defense-v42";
const ASSETS = [
  "./", "./index.html", "./styles.css?v=42", "./game.js?v=42", "./manifest.webmanifest", "./icon.svg",
  "./assets/city-battlefield-v1.webp", "./assets/posters/original/city-heroes-v1.webp", "./assets/city-zombies-v2.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(fetch(event.request).then((response) => {
    const copy = response.clone();
    caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
    return response;
  }).catch(() => caches.match(event.request)));
});
