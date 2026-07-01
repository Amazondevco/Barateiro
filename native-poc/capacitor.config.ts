import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "ai.check.poc",
  appName: "Check.AI",
  webDir: "dist",
  server: {
    // Permite que o WebView carregue conteúdo externo IN-PLACE (ex.: o iframe do
    // player do VLibras + assets do CDN). Sem isso, o Capacitor intercepta a
    // navegação/iframe pra hosts externos e o widget inicializa mas não
    // renderiza nada (botão vazio + player wrapper vazio).
    allowNavigation: [
      "cdn.jsdelivr.net",
      "*.jsdelivr.net",
      "vlibras.gov.br",
      "*.vlibras.gov.br",
    ],
  },
  plugins: {
    // OTA manual (atualização sem reinstalar): o app controla quando baixar/aplicar.
    CapacitorUpdater: {
      autoUpdate: false,
    },
  },
};

export default config;
