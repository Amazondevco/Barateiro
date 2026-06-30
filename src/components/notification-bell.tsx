"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Bell, Loader2, ClipboardList } from "lucide-react";
import { getNotificacoes, type Notificacao } from "@/lib/notificacoes-actions";

function tempoAtras(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return "";
  const seg = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (seg < 60) return "agora";
  const min = Math.floor(seg / 60);
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const d = Math.floor(h / 24);
  return d === 1 ? "ontem" : `há ${d} dias`;
}

export function NotificationBell() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [itens, setItens] = useState<Notificacao[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const r = await getNotificacoes();
      setItens(r.itens);
      setTotal(r.total);
    } finally {
      setLoading(false);
    }
  }, []);

  // Carrega ao montar + quando a janela volta ao foco (conta pode ter mudado).
  useEffect(() => {
    void carregar();
    const onFocus = () => void carregar();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [carregar]);

  // posiciona/ancora o balão e fecha ao clicar fora
  function updateRect() {
    if (wrapRef.current) setRect(wrapRef.current.getBoundingClientRect());
  }
  useEffect(() => {
    if (!open) return;
    updateRect();
    void carregar();
    function onDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    document.addEventListener("mousedown", onDown);
    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open, carregar]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Notificações"
        title="Notificações"
        className="relative flex h-9 w-9 items-center justify-center rounded-lg text-foreground/70 transition-colors hover:bg-foreground/10 hover:text-foreground"
      >
        <Bell className="h-[18px] w-[18px]" />
        {total > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold leading-none text-white">
            {total > 9 ? "9+" : total}
          </span>
        )}
      </button>

      {open &&
        rect &&
        createPortal(
          <div
            className="fixed z-50 overflow-hidden rounded-xl border border-border bg-card text-foreground shadow-xl"
            style={{
              top: rect.bottom + 8,
              left: Math.max(8, rect.right - 360),
              width: 360,
            }}
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-semibold">Notificações</p>
              {total > 0 && (
                <span className="rounded-full bg-danger-bg px-2 py-0.5 text-xs font-semibold text-danger">
                  {total} nova{total > 1 ? "s" : ""}
                </span>
              )}
            </div>

            <div className="max-h-[60vh] overflow-y-auto py-1.5">
              {loading && itens.length === 0 ? (
                <div className="flex items-center gap-2 px-4 py-8 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Carregando…
                </div>
              ) : itens.length === 0 ? (
                <div className="px-4 py-10 text-center text-sm text-muted-foreground">
                  <Bell className="mx-auto mb-2 h-6 w-6 opacity-40" />
                  Sem novidades por aqui.
                </div>
              ) : (
                itens.map((n) => (
                  <button
                    key={n.id}
                    onClick={() => {
                      setOpen(false);
                      router.push(n.href);
                    }}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60"
                  >
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <ClipboardList className="h-4 w-4" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center justify-between gap-2">
                        <span className="truncate text-sm font-medium">
                          {n.titulo}
                        </span>
                        <span className="shrink-0 text-[11px] text-muted-foreground">
                          {tempoAtras(n.quando)}
                        </span>
                      </span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {n.subtitulo}
                      </span>
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
