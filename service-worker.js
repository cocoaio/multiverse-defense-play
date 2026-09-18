const CACHE_NAME = "multiverse-defense-v43";
const CORE_ASSETS = [
  "./",
  "./index.html",
  "./styles.css?v=43",
  "./game.js?v=43",
  "./manifest.webmanifest",
  "./icon.svg",
  "./assets/companions-v1.png",
  "./assets/city-battlefield-v1.webp",
  "./assets/fallback/city-battlefield-v1.jpg",
  "./assets/posters/original/city-heroes-v1.webp",
  "./assets/fallback/posters/original/city-heroes-v1.png",
  "./assets/city-zombies-v2.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE_NAME).then((cache) => Promise.allSettled(CORE_ASSETS.map(async (url) => {
    const response = await fetch(new Request(url, { cache: "reload" }));
    if (response.ok) await cache.put(url, response);
  }))));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))));
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});

async function networkFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  try {
    const response = await fetch(request);
    if (response.ok) await cache.put(request, response.clone());
    return response;
  } catch (error) {
    return (await cache.match(request)) || (request.mode === "navigate" ? cache.match("./index.html") : Promise.reject(error));
  }
}

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) await cache.put(request, response.clone());
  return response;
}

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  const destination = event.request.destination;
  if (event.request.mode === "navigate" || destination === "script" || destination === "style") {
    event.respondWith(networkFirst(event.request));
  } else if (destination === "image" || destination === "font") {
    event.respondWith(cacheFirst(event.request));
  } else {
    event.respondWith(networkFirst(event.request));
  }
});
