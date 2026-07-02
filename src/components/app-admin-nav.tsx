"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, ClipboardCheck, ChartColumn, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

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

export function AppAdminNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <div className="mx-auto flex max-w-md items-stretch">
        {TABS.map((t) => {
          const on = t.match(pathname);
          const Icon = t.icon;
          return (
            <Link
              key={t.href}
              href={t.href}
              aria-current={on ? "page" : undefined}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2.5 text-xs font-medium transition-colors",
                on ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="h-5 w-5" aria-hidden="true" />
              {t.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
