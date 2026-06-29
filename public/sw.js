// Service worker de PRODUÇÃO (v7) — instalação (Android) + offline.
// Navegação = REDE PRIMEIRO (online sempre fresco → sem "Server Action"
// desatualizada). Em sucesso, guarda a página; offline serve essa cópia da
// MESMA rota e, se não houver, a página /offline.
// No INSTALL já guarda as telas principais (autenticadas, com cookies) → um
// único acesso online deixa o app pronto pra abrir offline (até em cold start).
// Assets hashados/ícones = cache-first.

const CACHE = "checkai-v7";
const OFFLINE_URL = "/offline";
const PRECACHE = ["/offline", "/icon-512.svg"];
// Telas do app pré-carregadas no install (falha em uma não quebra as outras).
const APP_ROUTES = [
  "/app",
  "/app/avisos",
  "/app/formularios",
  "/app/perfil",
  "/app/config",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE).then(async (c) => {
      await c.addAll(PRECACHE).catch(() => {});
      // rotas autenticadas: tenta uma a uma, ignorando as que falharem
      await Promise.all(
        APP_ROUTES.map((r) =>
          fetch(r, { credentials: "include" })
            .then((res) => (res.ok ? c.put(r, res) : null))
            .catch(() => {}),
        ),
      );
    }),
  );
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

  const url = new URL(request.url);
  const sameOrigin = url.origin === self.location.origin;
  const accept = request.headers.get("accept") || "";
  // Documento HTML (navegação OU fetch de página com Accept text/html, usado
  // para "aquecer" o cache). Rede primeiro (online sempre fresco → sem Server
  // Action desatualizada); offline → cópia da mesma rota → senão /offline.
  const ehDocumento =
    request.mode === "navigate" || (sameOrigin && accept.includes("text/html"));
  if (ehDocumento) {
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
