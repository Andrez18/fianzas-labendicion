// Minimal service worker to make the app installable as a PWA.
const CACHE = "prestamos-v1"
const APP_SHELL = ["/", "/offline"]

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL)).catch(() => {}),
  )
  self.skipWaiting()
})

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  )
  self.clients.claim()
})

// Network-first for navigations so data stays fresh; fall back to cache offline.
self.addEventListener("fetch", (event) => {
  const { request } = event
  if (request.method !== "GET") return

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone()
          caches.open(CACHE).then((cache) => cache.put(request, copy)).catch(() => {})
          return response
        })
        .catch(() => caches.match(request).then((r) => r || caches.match("/offline"))),
    )
  }
})
