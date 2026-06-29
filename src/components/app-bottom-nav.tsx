"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Bell, ClipboardCheck, User, Settings, type LucideIcon } from "lucide-react";

const TABS: { href: string; icon: LucideIcon; match: (p: string) => boolean }[] = [
  { href: "/app", icon: Home, match: (p) => p === "/app" || p.startsWith("/app/rede") },
  { href: "/app/avisos", icon: Bell, match: (p) => p.startsWith("/app/avisos") },
  { href: "/app/formularios", icon: ClipboardCheck, match: (p) => p.startsWith("/app/formularios") },
  { href: "/app/perfil", icon: User, match: (p) => p.startsWith("/app/perfil") },
  { href: "/app/config", icon: Settings, match: (p) => p.startsWith("/app/config") },
];

export function AppBottomNav() {
  const pathname = usePathname();
  let active = TABS.findIndex((t) => t.match(pathname));
  if (active < 0) active = 0;
  const n = TABS.length;

  return (
    <nav className="sticky bottom-0 z-30 border-t border-border bg-card">
      <div className="relative mx-auto flex h-[68px] max-w-md items-center px-1">
        {/* indicador deslizante (fundo arredondado que passa de um pro outro) */}
        <div
          className="pointer-events-none absolute h-full transition-transform duration-300 ease-out"
          style={{ width: `${100 / n}%`, transform: `translateX(${active * 100}%)` }}
          aria-hidden
        >
          <div className="absolute left-1/2 top-1/2 h-[52px] w-[58px] -translate-x-1/2 -translate-y-1/2 rounded-[20px] bg-primary shadow-sm" />
        </div>

        {TABS.map((t, i) => {
          const Icon = t.icon;
          const on = i === active;
          return (
            <Link
              key={t.href}
              href={t.href}
              className="relative z-10 flex h-full flex-1 items-center justify-center"
              aria-label={t.href}
            >
              <Icon
                className={`h-7 w-7 transition-colors duration-300 ${
                  on ? "text-primary-foreground" : "text-muted-foreground"
                }`}
              />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
