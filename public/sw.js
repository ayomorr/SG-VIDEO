const CACHE = "scrolldictive-v2";
const NAV_CACHE = "scrolldictive-nav-v2";
self.addEventListener("install", (event) => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys.filter((k) => k !== CACHE && k !== NAV_CACHE).map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    (async () => {
      const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
      for (const client of clients) {
        if (client.url.includes("/app") && "focus" in client) {
          await client.focus();
          return;
        }
      }
      await self.clients.openWindow("/app");
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/")) return;

  // The break-over alarm loads this the moment a break ends. Caching it with
  // stale-while-revalidate means a replaced siren keeps playing the old file
  // forever, and an offline ring gets Response.error() — which is precisely
  // the moment the user most needs to hear something. Go to the network, and
  // let the synthesised fallback in lib/audio/alarm cover the offline case.
  if (url.pathname.startsWith("/audio/")) return;

  // Icons are versioned by content in the repo; serving a stale home-screen
  // icon after a rebrand is the exact drift the icon generator prevents.
  if (url.pathname.startsWith("/icon") || url.pathname.startsWith("/apple-touch-icon")) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(networkFirst(request));
    return;
  }

  event.respondWith(staleWhileRevalidate(request));
});

async function networkFirst(request) {
  const cache = await caches.open(NAV_CACHE);
  try {
    const fresh = await fetch(request);
    if (fresh.ok) cache.put(request, fresh.clone());
    return fresh;
  } catch {
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response("Offline", { status: 503, statusText: "Offline" });
  }
}

async function staleWhileRevalidate(request) {
  const cache = await caches.open(CACHE);
  const cached = await cache.match(request);

  const update = fetch(request)
    .then((fresh) => {
      if (fresh.ok) cache.put(request, fresh.clone());
      return fresh;
    })
    .catch(() => null);

  if (cached) return cached;
  const fresh = await update;
  if (fresh) return fresh;
  return cached || Response.error();
}