const CACHE_NAME = "multiverse-defense-v39";
const ASSETS = [
  "./", "./index.html", "./styles.css?v=39", "./game.js?v=39", "./manifest.webmanifest", "./icon.svg",
  "./assets/city-battlefield-v1.webp", "./assets/snow-battlefield-v1.webp", "./assets/hospital-battlefield-v1.webp",
  "./assets/orbit-battlefield-v1.webp", "./assets/mars-battlefield-v1.webp", "./assets/moon-battlefield-v1.webp", "./assets/cultivation-battlefield-v1.webp",
  "./assets/posters/original/hero-archetypes-v1.webp", "./assets/posters/original/city-heroes-v1.webp", "./assets/posters/original/snow-heroes-v1.webp",
  "./assets/posters/original/hospital-heroes-v1.webp", "./assets/posters/original/orbit-ships-v1.webp", "./assets/posters/original/mars-heroes-v1.webp",
  "./assets/posters/original/moon-heroes-v1.webp", "./assets/posters/original/cultivator-heroes-v1.webp",
  "./assets/enemy-worlds-v1.webp", "./assets/cultivator-enemies-v2.webp",
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
