import { useEffect, useRef, useState } from "react";

// Widget VLibras + DIAGNÓSTICO (temporário) para descobrir por que não aparece
// no WebView nativo. Registra cada passo e mostra numa caixinha na tela.
// Aponta direto pro jsdelivr (destino final, sem o 302 do gov.br).
const BASE =
  "https://cdn.jsdelivr.net/gh/spbgovbr-vlibras/vlibras-portal@sgd/app";
const SRC = `${BASE}/vlibras-plugin.js`;

type WinV = Window & { VLibras?: { Widget: new (url: string) => unknown } };

export function VLibras() {
  const ref = useRef<HTMLDivElement>(null);
  const [log, setLog] = useState<string[]>([]);
  const [aberto, setAberto] = useState(true);

  useEffect(() => {
    const add = (m: string) =>
      setLog((l) => [...l, m.length > 140 ? m.slice(0, 140) + "…" : m]);

    if (ref.current && ref.current.childElementCount === 0) {
      ref.current.innerHTML = `
        <div vw class="enabled">
          <div vw-access-button class="active"></div>
          <div vw-plugin-wrapper><div class="vw-plugin-top-wrapper"></div></div>
        </div>`;
    }

    add(`origin: ${location.origin}`);
    add(`WebAssembly: ${typeof WebAssembly}`);

    // Captura erros globais que mencionem o vlibras/unity/wasm.
    const onErr = (e: ErrorEvent) => {
      const s = `${e.message ?? ""} @ ${e.filename ?? ""}`;
      if (/vlibras|unity|wasm|player|\bvw\b|Widget/i.test(s))
        add(`ERRO JS: ${s}`);
    };
    const onRej = (e: PromiseRejectionEvent) => {
      const s = String(
        (e.reason && (e.reason.message || e.reason)) ?? e.reason,
      );
      if (/vlibras|unity|wasm|player/i.test(s)) add(`REJEIÇÃO: ${s}`);
    };
    window.addEventListener("error", onErr);
    window.addEventListener("unhandledrejection", onRej);

    // Teste de rede: o WebView consegue baixar o plugin do CDN?
    fetch(SRC)
      .then((r) => add(`fetch plugin: HTTP ${r.status}`))
      .catch((err) => add(`fetch plugin FALHOU: ${String(err)}`));

    function iniciar() {
      const w = window as unknown as WinV;
      add(`script carregou; window.VLibras=${typeof w.VLibras}`);
      try {
        if (w.VLibras) {
          new w.VLibras.Widget(BASE);
          add("Widget() executou sem erro");
        } else {
          add("window.VLibras AUSENTE após o load");
        }
      } catch (err) {
        add(`Widget() LANÇOU: ${err instanceof Error ? err.message : String(err)}`);
      }
      // Depois de um tempo: o botão de acesso foi criado e está visível?
      window.setTimeout(() => {
        const btn = document.querySelector(
          "[vw-access-button]",
        ) as HTMLElement | null;
        if (!btn) {
          add("botão: NÃO existe no DOM");
          return;
        }
        const r = btn.getBoundingClientRect();
        const cs = getComputedStyle(btn);
        add(
          `botão: existe ${Math.round(r.width)}x${Math.round(r.height)} @${Math.round(r.left)},${Math.round(r.top)} display=${cs.display} vis=${cs.visibility}`,
        );
        const img = btn.querySelector("img") as HTMLImageElement | null;
        add(`botão img: ${img ? `${img.complete ? "carregada" : "carregando"} ${img.naturalWidth}px` : "sem <img>"}`);
      }, 3500);
    }

    const existente = document.querySelector<HTMLScriptElement>(
      `script[src="${SRC}"]`,
    );
    if (existente) {
      add("script já estava na página");
      iniciar();
    } else {
      const s = document.createElement("script");
      s.src = SRC;
      s.async = true;
      s.onload = iniciar;
      s.onerror = () => add("script.onerror — NÃO carregou (bloqueio/rede)");
      document.body.appendChild(s);
      add("script anexado ao body");
    }

    return () => {
      window.removeEventListener("error", onErr);
      window.removeEventListener("unhandledrejection", onRej);
    };
  }, []);

  return (
    <>
      <div ref={ref} aria-hidden="true" />
      {aberto && (
        <div
          className="fixed inset-x-2 z-[9999] rounded-xl border border-border bg-card p-3 shadow-2xl"
          style={{ top: "calc(env(safe-area-inset-top) + 8px)" }}
        >
          <div className="mb-1 flex items-center justify-between text-xs font-bold">
            <span>VLibras · diagnóstico</span>
            <button
              type="button"
              onClick={() => setAberto(false)}
              className="rounded bg-muted px-2 py-0.5 font-semibold"
            >
              fechar
            </button>
          </div>
          <div className="max-h-52 space-y-0.5 overflow-auto font-mono text-[10px] leading-snug text-muted-foreground">
            {log.map((l, i) => (
              <div key={i}>• {l}</div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
