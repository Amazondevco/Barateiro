"use client";

import { useRef, useState, useTransition } from "react";
import { createPortal } from "react-dom";
import { ArrowRightLeft, Check, Loader2 } from "lucide-react";
import { DEV_ACCOUNTS } from "@/lib/dev-accounts";
import { quickSwitch } from "@/lib/dev-switch-actions";

/** DEV: alterna entre contas de teste. Só renderizado em desenvolvimento.
 *  O gatilho é estilizável por contexto: na sidebar (fundo escuro) recebe as
 *  classes dos outros itens do menu (cor clara + rótulo); no PWA usa o ícone. */
export function UserSwitcher({
  currentEmail,
  triggerClassName,
  triggerLabel,
}: {
  currentEmail: string;
  triggerClassName?: string;
  triggerLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const wrapRef = useRef<HTMLDivElement>(null);

  function abrir() {
    if (wrapRef.current) setRect(wrapRef.current.getBoundingClientRect());
    setOpen(true);
  }

  function trocar(email: string) {
    setErro(null);
    setInfo(null);
    setInfo("Trocando…");
    start(async () => {
      try {
        const r = await quickSwitch(email);
        if (r.error) {
          setInfo(null);
          setErro(r.error);
          return;
        }
        // Mostra o diagnóstico por ~2s e então recarrega de verdade.
        if (r.info) setInfo(r.info);
        if (r.to) {
          const dest = r.to;
          setTimeout(() => {
            window.location.href = dest;
          }, 2000);
        }
      } catch (e) {
        // Exceção lançada no servidor (o await rejeita) — agora fica visível.
        setInfo(null);
        setErro(`Exceção: ${e instanceof Error ? e.message : String(e)}`);
      }
    });
  }

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => (open ? setOpen(false) : abrir())}
        aria-label="Trocar visualização"
        title="Trocar visualização"
        className={
          triggerClassName ??
          "inline-flex h-9 w-9 items-center justify-center rounded-lg text-foreground transition-colors hover:bg-muted"
        }
      >
        <ArrowRightLeft className="h-[18px] w-[18px] shrink-0" />
        {triggerLabel ? <span>{triggerLabel}</span> : null}
      </button>

      {open &&
        rect &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            <div
              data-userswitcher=""
              className="fixed inset-0 z-[60]"
              onClick={() => setOpen(false)}
            />
            {/* Posição ADAPTATIVA: na sidebar do painel (botão à esquerda, em
                baixo) abre à direita e pra cima; no PWA (botão no topo direito)
                abre à esquerda e pra baixo. Antes era fixo à direita → no PWA o
                dropdown saía da tela.
                data-userswitcher: o menu do usuário ignora cliques aqui (senão o
                clique-fora no mousedown desmontava o portal antes do clique). */}
            <div
              data-userswitcher=""
              className="fixed z-[61] max-h-[70vh] w-64 overflow-auto rounded-xl border border-border bg-card text-foreground shadow-xl"
              style={{
                ...(rect.right + 8 + 256 <= window.innerWidth
                  ? { left: rect.right + 8 }
                  : { right: Math.max(8, window.innerWidth - rect.right) }),
                ...(rect.top > window.innerHeight / 2
                  ? { bottom: Math.max(8, window.innerHeight - rect.bottom) }
                  : { top: rect.bottom + 8 }),
              }}
            >
              <p className="border-b border-border px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Trocar visualização
              </p>
              {DEV_ACCOUNTS.map((a) => {
                const current = a.email === currentEmail;
                return (
                  <button
                    key={a.email}
                    type="button"
                    disabled={current || pending}
                    onClick={() => trocar(a.email)}
                    className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted disabled:opacity-60"
                  >
                    <span>
                      <span className="block font-medium">{a.label}</span>
                      <span className="block text-xs text-muted-foreground">
                        {a.role} · {a.email}
                      </span>
                    </span>
                    {current ? (
                      <Check className="h-4 w-4 shrink-0 text-primary" />
                    ) : pending ? (
                      <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />
                    ) : null}
                  </button>
                );
              })}
              {erro && (
                <p className="border-t border-border bg-danger-bg px-3 py-2 text-xs text-danger">
                  {erro}
                </p>
              )}
              {info && (
                <p className="border-t border-border bg-success-bg px-3 py-2 text-xs text-success">
                  {info} — recarregando…
                </p>
              )}
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
