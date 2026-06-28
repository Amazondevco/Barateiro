"use client";

import { useState } from "react";
import { ArrowRightLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DEV_ACCOUNTS } from "@/lib/dev-accounts";
import { quickSwitch } from "@/lib/dev-switch-actions";

/** DEV: alterna entre contas de teste. Só renderizado em desenvolvimento. */
export function UserSwitcher({ currentEmail }: { currentEmail: string }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setOpen((v) => !v)}
        aria-label="Trocar de usuário (dev)"
        title="Trocar de usuário (dev)"
      >
        <ArrowRightLeft className="h-[18px] w-[18px]" />
      </Button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-60 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
            <p className="border-b border-border px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Trocar de usuário (dev)
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
                    {current && <Check className="h-4 w-4 text-primary" />}
                  </button>
                </form>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
