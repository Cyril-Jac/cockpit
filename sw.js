/* Service Worker Cockpit: App-Hülle offline, Daten kommen aus der App (localStorage). */
const VERSION = "cockpit-1.0.0";
const HUELLE = ["./", "index.html", "style.css?v=1", "app.js?v=1", "vendor/supabase.js", "manifest.webmanifest", "icons/icon-192.png", "icons/apple-touch-icon.png"];
self.addEventListener("install", (e) => { e.waitUntil(caches.open(VERSION).then((c) => c.addAll(HUELLE)).then(() => self.skipWaiting())); });
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== VERSION).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== "GET" || url.origin !== location.origin) return; // Supabase nie cachen
  e.respondWith(fetch(e.request).then((r) => { const k = r.clone(); caches.open(VERSION).then((c) => c.put(e.request, k)); return r; })
    .catch(() => caches.match(e.request).then((r) => r || caches.match("index.html"))));
});
