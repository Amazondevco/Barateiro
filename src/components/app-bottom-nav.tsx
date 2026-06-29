"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Mail, User, Settings, type LucideIcon } from "lucide-react";

const TABS: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/app", label: "Início", icon: Home },
  { href: "/app/avisos", label: "Avisos", icon: Mail },
  { href: "/app/perfil", label: "Perfil", icon: User },
  { href: "/app/config", label: "Config", icon: Settings },
];

export function AppBottomNav() {
  const pathname = usePathname();

  function ativo(href: string) {
    if (href === "/app") return pathname === "/app" || pathname.startsWith("/app/rede");
    return pathname.startsWith(href);
  }

  return (
    <nav className="sticky bottom-0 z-30 flex items-center justify-around border-t border-border bg-card px-2 py-1.5">
      {TABS.map((t) => {
        const on = ativo(t.href);
        const Icon = t.icon;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`flex h-11 min-w-[56px] items-center justify-center gap-2 rounded-full px-4 transition-colors ${
              on ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
            aria-label={t.label}
          >
            <Icon className="h-5 w-5" />
            {on && <span className="text-sm font-medium">{t.label}</span>}
          </Link>
        );
      })}
    </nav>
  );
}
