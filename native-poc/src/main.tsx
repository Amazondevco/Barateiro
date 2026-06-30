import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { initOta } from "./lib/ota";
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

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);

// OTA: confirma o bundle e checa atualização (só em nativo).
void initOta();
