import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// base "./" + sem crossorigin: assets carregam no WebView do Capacitor
// (caminho absoluto / crossorigin causa tela branca no Android).
export default defineConfig({
  base: "./",
  plugins: [
    react(),
    tailwindcss(),
    {
      name: "strip-crossorigin",
      transformIndexHtml(html) {
        return html.replace(/\s+crossorigin/g, "");
      },
    },
  ],
});
