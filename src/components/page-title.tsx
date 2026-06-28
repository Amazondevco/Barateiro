"use client";

import Link from "next/link";
import { createContext, useContext, useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";
import { usePathname } from "next/navigation";
import { NAV } from "@/lib/nav";

type TitleState = { pathname: string; title: string; crumb?: string };

const Ctx = createContext<{
  state: TitleState | null;
  set: (s: TitleState) => void;
} | null>(null);

// Títulos derivados da rota (fallback imediato até a página definir o seu)
const EXTRA: Record<string, { title: string; crumb?: string }> = {
  "/": { title: "Visão geral" },
  "/clientes/nova": { title: "Nova rede" },
};

export function routeTitle(pathname: string): { title: string; crumb?: string } {
  if (EXTRA[pathname]) return EXTRA[pathname];
  const exact = NAV.find((n) => n.href === pathname);
  if (exact) return { title: exact.label };
  if (pathname.startsWith("/clientes/")) return { title: "Cliente" };
  const pref = NAV.filter(
    (n) => n.href !== "/" && pathname.startsWith(n.href),
  ).sort((a, b) => b.href.length - a.href.length)[0];
  if (pref) return { title: pref.label };
  return { title: "Console" };
}

export function PageTitleProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<TitleState | null>(null);
  return (
    <Ctx.Provider value={{ state, set: setState }}>{children}</Ctx.Provider>
  );
}

/** Renderizado pelas páginas (via PageHeader) — empurra o título para o topbar. */
export function PageTitle({ title, crumb }: { title: string; crumb?: string }) {
  const ctx = useContext(Ctx);
  const pathname = usePathname();
  const set = ctx?.set;
  useEffect(() => {
    set?.({ pathname, title, crumb });
  }, [set, pathname, title, crumb]);
  return null;
}

/** Exibido no topbar. Usa o título da página se for da rota atual; senão, fallback. */
export function TopbarTitle() {
  const ctx = useContext(Ctx);
  const pathname = usePathname();
  const fromPage =
    ctx?.state && ctx.state.pathname === pathname ? ctx.state : null;
  const t = fromPage ?? routeTitle(pathname);

  return (
    <div className="min-w-0">
      <nav className="flex items-center gap-1 text-xs">
        <Link href="/" className="font-semibold text-primary hover:underline">
          Console
        </Link>
        <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
        <span className="truncate text-muted-foreground">
          {t.crumb ?? t.title}
        </span>
      </nav>
      <h1 className="truncate text-lg font-bold leading-tight">{t.title}</h1>
    </div>
  );
}
