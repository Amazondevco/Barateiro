import { useEffect, useRef } from "react";

// Widget VLibras (Governo Federal): tradutor de texto para Libras com avatar 3D.
// Injeta a marcação `[vw]` que o script oficial procura e inicializa o Widget.
// Carrega uma vez; se o script externo falhar (offline), some silenciosamente.
const SRC = "https://vlibras.gov.br/app/vlibras-plugin.js";

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
        if (w.VLibras) new w.VLibras.Widget("https://vlibras.gov.br/app");
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
