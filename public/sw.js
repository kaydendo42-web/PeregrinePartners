// PeregrineOffice service worker.
//
// Deliberately small: it never caches bookings, customers or any page a
// member signs in to see. It keeps one thing, an offline screen, so opening
// the installed app with no signal says so instead of showing the browser's
// error page. Everything else goes straight to the network.

const CACHE = "peregrineoffice-v1";
const OFFLINE = "/offline.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll([OFFLINE, "/app/icon-192.png"])),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  if (event.request.mode !== "navigate") return;
  event.respondWith(
    fetch(event.request).catch(() => caches.match(OFFLINE).then((r) => r ?? Response.error())),
  );
});
