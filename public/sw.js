// Service worker de PRODUÇÃO (v4) — habilita instalação (Android) + offline básico.
// Estratégia segura: navegação = rede primeiro (offline → página /offline);
// assets estáticos (hashados) = cache-first. NÃO cacheia HTML autenticado
// (evita "Failed to find Server Action" entre deploys).

const CACHE = "checkai-v4";
const OFFLINE_URL = "/offline";
const PRECACHE = ["/offline", "/icon-512.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  // Navegação: rede primeiro; offline → página de fallback.
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE_URL)));
    return;
  }

  // Assets imutáveis (hashados pelo Next) e ícones: cache-first.
  const url = new URL(request.url);
  if (
    url.pathname.startsWith("/_next/static/") ||
    /\.(?:js|css|svg|png|jpg|jpeg|webp|woff2?)$/.test(url.pathname)
  ) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((res) => {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(request, copy));
            return res;
          }),
      ),
    );
  }
});
