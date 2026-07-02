"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, ClipboardCheck, ChartColumn, type LucideIcon } from "lucide-react";

const TABS: {
  href: string;
  icon: LucideIcon;
  label: string;
  match: (p: string) => boolean;
}[] = [
  {
    href: "/app/admin/gestao",
    icon: Building2,
    label: "Gestão",
    match: (p) => p.startsWith("/app/admin/gestao"),
  },
  {
    href: "/app/admin/preenchidos",
    icon: ClipboardCheck,
    label: "Preenchidos",
    match: (p) => p.startsWith("/app/admin/preenchidos"),
  },
  {
    href: "/app/admin/relatorios",
    icon: ChartColumn,
    label: "Relatórios",
    match: (p) => p.startsWith("/app/admin/relatorios"),
  },
];

// Mesmo conceito da barra do app dos operadores: pílula flutuante + item ativo
// num círculo (cor da rede) elevado, recortado na barra.
export function AppAdminNav() {
  const pathname = usePathname();
  let active = TABS.findIndex((t) => t.match(pathname));
  if (active < 0) active = 0;

  return (
    // Barra flutuante: não encosta nas bordas; cliques passam pelas laterais.
    // Sobe acima da barra de navegação do sistema (safe-area-inset-bottom).
    <nav
      className="pointer-events-none fixed inset-x-0 z-30 px-5"
      style={{ bottom: "calc(1.5rem + env(safe-area-inset-bottom))" }}
    >
      <div className="pointer-events-auto mx-auto flex h-16 max-w-md items-center justify-between rounded-[32px] bg-card px-4 shadow-[0_10px_25px_-5px_rgba(0,0,0,0.12),0_8px_10px_-6px_rgba(0,0,0,0.1)]">
        {TABS.map((t, i) => {
          const Icon = t.icon;
          const on = i === active;
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-label={t.label}
              aria-current={on ? "page" : undefined}
              className="relative flex flex-1 items-center justify-center"
            >
              <span
                className={`relative flex h-[50px] w-[50px] items-center justify-center transition-transform duration-300 ${
                  on ? "-translate-y-[22px]" : ""
                }`}
              >
                {on ? (
                  <span className="absolute h-14 w-14 rounded-full border-[6px] border-background bg-primary shadow-[0_6px_14px_-2px_rgba(0,0,0,0.3)]" />
                ) : null}
                <Icon
                  aria-hidden="true"
                  className={`relative h-6 w-6 transition-colors duration-300 ${
                    on ? "text-primary-foreground" : "text-muted-foreground"
                  }`}
                />
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
