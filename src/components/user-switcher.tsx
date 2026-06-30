"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowRightLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEV_ACCOUNTS } from "@/lib/dev-accounts";
import { quickSwitch } from "@/lib/dev-switch-actions";

/** DEV: alterna entre contas de teste. Só renderizado em desenvolvimento. */
export function UserSwitcher({ currentEmail }: { currentEmail: string }) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  function abrir() {
    if (wrapRef.current) setRect(wrapRef.current.getBoundingClientRect());
    setOpen(true);
  }

  return (
    <div ref={wrapRef} className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => (open ? setOpen(false) : abrir())}
        aria-label="Trocar visualização"
        title="Trocar visualização"
      >
        <ArrowRightLeft className="h-[18px] w-[18px]" />
      </Button>

      {open &&
        rect &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />
            {/* Abre à DIREITA do botão e ancorado para cima — visível mesmo na
                sidebar (que fica colada na borda esquerda). */}
            <div
              className="fixed z-[61] max-h-[70vh] w-64 overflow-auto rounded-xl border border-border bg-card text-foreground shadow-xl"
              style={{
                left: rect.right + 8,
                bottom: Math.max(8, window.innerHeight - rect.bottom),
              }}
            >
              <p className="border-b border-border px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Trocar visualização
              </p>
              {DEV_ACCOUNTS.map((a) => {
                const current = a.email === currentEmail;
                return (
                  <form key={a.email} action={quickSwitch.bind(null, a.email)}>
                    <button
                      type="submit"
                      disabled={current}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted disabled:opacity-60"
                    >
                      <span>
                        <span className="block font-medium">{a.label}</span>
                        <span className="block text-xs text-muted-foreground">
                          {a.role} · {a.email}
                        </span>
                      </span>
                      {current && <Check className="h-4 w-4 shrink-0 text-primary" />}
                    </button>
                  </form>
                );
              })}
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
