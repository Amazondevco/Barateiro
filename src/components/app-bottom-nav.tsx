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
      <div className="relative mx-auto flex h-[60px] max-w-md items-center">
        {/* indicador deslizante: largura = 1 célula; pílula centralizada por flex */}
        <div
          className="pointer-events-none absolute inset-y-0 left-0 flex items-center justify-center transition-transform duration-300 ease-out"
          style={{ width: `${100 / n}%`, transform: `translateX(${active * 100}%)` }}
          aria-hidden
        >
          <div className="h-[40px] w-[44px] rounded-[15px] bg-primary shadow-sm" />
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
                className={`h-[21px] w-[21px] transition-colors duration-300 ${
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
