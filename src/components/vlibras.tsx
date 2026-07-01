"use client";

import { useEffect, useRef } from "react";

// Widget VLibras (Governo Federal): tradutor de texto para Libras com avatar 3D.
// IMPORTANTE: a URL oficial vlibras.gov.br/app REDIRECIONA (302) para o jsdelivr,
// e redirect de <script>/assets quebra dentro do WebView do Capacitor (servido
// de https://localhost). Por isso apontamos DIRETO para o destino final (jsdelivr),
// sem redirect — assim funciona no app nativo, não só no navegador.
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
