import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { initOta } from "./lib/ota";
import "@fontsource-variable/geist";
import "./styles.css";

// Tema: preferência salva ("checkai-theme") tem prioridade; senão segue o sistema.
// A tela de Config escreve nessa mesma chave (espelha o ThemeToggle do PWA).
const savedTheme = localStorage.getItem("checkai-theme");
const prefersDark =
  savedTheme === "dark" ||
  (savedTheme == null &&
    window.matchMedia?.("(prefers-color-scheme: dark)")?.matches);
document.documentElement.classList.toggle("dark", Boolean(prefersDark));

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);

// OTA: confirma o bundle e checa atualização (só em nativo).
void initOta();
