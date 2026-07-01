import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import { App as CapacitorApp } from "@capacitor/app";
import App from "./App";
import { initOta } from "./lib/ota";
import { aplicarStatusBar } from "./lib/status-bar";
import { I18nProvider, readLang } from "./lib/i18n/i18n";
import { getRouteFromDeepLink, setPendingCadastro } from "./lib/deep-links";
import "./styles.css";

// Tema: preferência salva ("checkai-theme") tem prioridade; senão segue o sistema.
// A tela de Config escreve nessa mesma chave (espelha o ThemeToggle do PWA).
const savedTheme = localStorage.getItem("checkai-theme");
const prefersDark =
  savedTheme === "dark" ||
  (savedTheme == null &&
    window.matchMedia?.("(prefers-color-scheme: dark)")?.matches);
document.documentElement.classList.toggle("dark", Boolean(prefersDark));

// Cor da rede: reaplica no boot (se a página recarregar dentro do app, ex.: no
// meio de um checklist, a cor não volta ao padrão). Salva em applyPrimaryColor.
const savedPrimary = localStorage.getItem("checkai-primary");
if (savedPrimary) {
  document.documentElement.style.setProperty("--primary", savedPrimary);
  document.documentElement.style.setProperty(
    "--primary-hover",
    `color-mix(in srgb, ${savedPrimary} 85%, black)`,
  );
}

// Idioma salvo (só no aparelho) já no boot, para o <html lang>.
const lang0 = readLang();
document.documentElement.lang =
  lang0 === "pt" ? "pt-BR" : lang0 === "es" ? "es" : "en";

function montar() {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <I18nProvider>
        <HashRouter>
          <App />
        </HashRouter>
      </I18nProvider>
    </StrictMode>,
  );

  // Barra de status sólida já no boot (login/pré-shell), seguindo o tema.
  void aplicarStatusBar(false, Boolean(prefersDark));

  // OTA: confirma o bundle e checa atualização (só em nativo). Roda DEPOIS de
  // marcar o cadastro pendente, para o OTA se adiar e não recarregar por cima.
  void initOta();
}

// Deep link de COLD START (app aberto pelo link do convite): captura a URL de
// lançamento ANTES de renderizar e posiciona a rota inicial (+ marca pendente,
// de forma durável). Isso evita a corrida com o reload do OTA no boot.
async function bootstrap() {
  try {
    const launch = await CapacitorApp.getLaunchUrl();
    const route = launch?.url ? getRouteFromDeepLink(launch.url) : null;
    if (route) {
      setPendingCadastro(route);
      window.location.hash = route;
    }
  } catch {
    /* web / plugin ausente → boot normal */
  }
  montar();
}

void bootstrap();
