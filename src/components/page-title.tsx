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
  "/busca": { title: "Busca" },
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

function humanize(seg: string) {
  return seg.charAt(0).toUpperCase() + seg.slice(1);
}

type Crumb = { label: string; href?: string };

/**
 * Trilha do breadcrumb. Retorna null no 1º nível (logo abaixo de Console),
 * pois o caminho seria redundante. Só monta a trilha a partir do 2º nível.
 */
function buildTrail(pathname: string, current: string): Crumb[] | null {
  const segs = pathname.split("/").filter(Boolean);
  if (segs.length <= 1) return null; // 1º nível → sem breadcrumb

  const trail: Crumb[] = [{ label: "Console", href: "/" }];
  let acc = "";
  for (let i = 0; i < segs.length - 1; i++) {
    acc += "/" + segs[i];
    const nav = NAV.find((n) => n.href === acc);
    trail.push({ label: nav?.label ?? humanize(segs[i]), href: acc });
  }
  trail.push({ label: current }); // página atual (sem link)
  return trail;
}

/** Exibido no topbar. Usa o título da página se for da rota atual; senão, fallback. */
export function TopbarTitle() {
  const ctx = useContext(Ctx);
  const pathname = usePathname();
  const fromPage =
    ctx?.state && ctx.state.pathname === pathname ? ctx.state : null;
  const t = fromPage ?? routeTitle(pathname);
  const trail = buildTrail(pathname, t.crumb ?? t.title);

  return (
    <div className="min-w-0">
      {trail && (
        <nav className="flex items-center gap-1 text-xs">
          {trail.map((c, i) => (
            <span key={i} className="flex items-center gap-1">
              {i > 0 && (
                <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground" />
              )}
              {c.href ? (
                <Link
                  href={c.href}
                  className="font-semibold text-foreground/90 hover:underline"
                >
                  {c.label}
                </Link>
              ) : (
                <span className="truncate text-muted-foreground">{c.label}</span>
              )}
            </span>
          ))}
        </nav>
      )}
      <h1 className="truncate text-lg font-bold leading-tight">{t.title}</h1>
    </div>
  );
}
