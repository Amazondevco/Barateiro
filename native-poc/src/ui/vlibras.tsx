import { useEffect, useRef } from "react";

// Widget VLibras (Governo Federal): tradutor de texto para Libras com avatar 3D.
// Funciona no PWA (navegador). No WebView nativo o widget carrega mas não
// renderiza (o player Unity não sobe no WebView do Capacitor) — mantido aqui por
// paridade; a solução de Libras no app nativo é tratada à parte.
const BASE =
  "https://cdn.jsdelivr.net/gh/spbgovbr-vlibras/vlibras-portal@sgd/app";
const SRC = `${BASE}/vlibras-plugin.js`;

export function VLibras() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (ref.current && ref.current.childElementCount === 0) {
      ref.current.innerHTML = `
        <div vw class="enabled">
          <div vw-access-button class="active"></div>
          <div vw-plugin-wrapper><div class="vw-plugin-top-wrapper"></div></div>
        </div>`;
    }

    function iniciar() {
      try {
        const w = window as unknown as {
          VLibras?: { Widget: new (url: string) => unknown };
        };
        if (w.VLibras) new w.VLibras.Widget(BASE);
      } catch {
        /* ignora */
      }
    }

    const existente = document.querySelector<HTMLScriptElement>(
      `script[src="${SRC}"]`,
    );
    if (existente) {
      iniciar();
      return;
    }
    const s = document.createElement("script");
    s.src = SRC;
    s.async = true;
    s.onload = iniciar;
    document.body.appendChild(s);
  }, []);

  return <div ref={ref} aria-hidden="true" />;
}
