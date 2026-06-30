"use client";

import { useState } from "react";
import Link from "next/link";
import { Menu, X, Home, Bell, ClipboardCheck, User, Settings, ArrowLeftRight, LogOut } from "lucide-react";
import { signOut } from "@/lib/auth-actions";

const ITENS = [
  { href: "/app", label: "Início", icon: Home },
  { href: "/app/avisos", label: "Avisos", icon: Bell },
  { href: "/app/formularios", label: "Checklists enviados", icon: ClipboardCheck },
  { href: "/app/perfil", label: "Perfil", icon: User },
  { href: "/app/config", label: "Configurações", icon: Settings },
];

export function AppDrawer({ nome }: { nome?: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-current hover:bg-black/10"
        aria-label="Menu"
      >
        <Menu className="h-6 w-6" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <div className="absolute left-0 top-0 flex h-full w-72 max-w-[80vw] flex-col bg-card shadow-xl">
            <div className="flex items-center justify-between border-b border-border p-4">
              <span className="font-semibold">{nome ?? "Menu"}</span>
              <button onClick={() => setOpen(false)} aria-label="Fechar" className="text-muted-foreground hover:text-foreground">
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex-1 space-y-1 p-2">
              {ITENS.map((i) => {
                const Icon = i.icon;
                return (
                  <Link
                    key={i.href}
                    href={i.href}
                    onClick={() => setOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-muted"
                  >
                    <Icon className="h-5 w-5 text-muted-foreground" /> {i.label}
                  </Link>
                );
              })}
              <Link
                href="/app"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm hover:bg-muted"
              >
                <ArrowLeftRight className="h-5 w-5 text-muted-foreground" /> Trocar unidade
              </Link>
            </nav>

            <div className="border-t border-border p-2">
              <form action={signOut}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-danger hover:bg-danger-bg"
                >
                  <LogOut className="h-5 w-5" /> Sair
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
