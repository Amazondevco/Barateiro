// Service worker de PRODUÇÃO (v5) — instalação (Android) + offline.
// Navegação = REDE PRIMEIRO (online sempre fresco → sem "Server Action"
// desatualizada). Em sucesso, guarda a página; offline serve essa cópia da
// MESMA rota e, se não houver, a página /offline.
// Assets hashados/ícones = cache-first.

const CACHE = "checkai-v5";
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

  // Navegação: rede primeiro (cacheia a cópia fresca); offline → cópia da
  // mesma rota (telas já visitadas abrem offline) → senão página de fallback.
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached || caches.match(OFFLINE_URL)),
        ),
    );
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
