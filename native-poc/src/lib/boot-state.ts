// Marca se o app já "abriu" (passou do carregamento inicial). O módulo reinicia
// a cada abertura fresca do webview (cold start / app fora do cache), então
// volta a false — e o carrossel de abertura roda de novo. Depois de aberto,
// os carregamentos internos usam só a logo da rede pulsando.
let booted = false;

export function isBooted() {
  return booted;
}

export function marcarBooted() {
  booted = true;
}
