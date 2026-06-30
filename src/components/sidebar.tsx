"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LifeBuoy } from "lucide-react";
import { Brand } from "@/components/brand";
import { NAV } from "@/lib/nav";
import type { Papel } from "@/lib/types";
import { cn } from "@/lib/utils";

const APP_VERSAO = "v1.0.0";

export function Sidebar({
  papel,
  brandName,
  brandLogo,
  brandSubtitle,
  collapsed = false,
  onNavigate,
}: {
  papel: Papel;
  brandName?: string;
  brandLogo?: string | null;
  brandSubtitle?: string;
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const items = NAV.filter((i) => i.roles.includes(papel));

  return (
    <aside
      className={cn(
        "flex h-full shrink-0 flex-col bg-sidebar transition-[width] duration-200",
        collapsed ? "w-16" : "w-64",
      )}
    >
      <div
        className={cn(
          "flex items-center border-b border-sidebar-border py-4",
          collapsed ? "justify-center px-0" : "px-4",
        )}
      >
        <Brand
          onDark
          compact={collapsed}
          name={brandName}
          logoUrl={brandLogo}
          subtitle={brandSubtitle}
        />
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onNavigate}
              title={collapsed ? item.label : undefined}
              className={cn(
                "flex items-center rounded-lg py-2 text-sm font-medium transition-colors",
                collapsed ? "justify-center px-0" : "gap-3 px-3",
                active
                  ? "bg-sidebar-active text-sidebar-active-foreground"
                  : "text-sidebar-foreground hover:bg-sidebar-hover hover:text-[color:var(--sidebar-strong)]",
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && item.label}
            </Link>
          );
        })}
      </nav>

      {/* Rodapé: suporte + versão/copyright (recolhe junto com a barra) */}
      <div className="border-t border-sidebar-border p-3">
        <Link
          href="/suporte"
          onClick={onNavigate}
          title={collapsed ? "Suporte Check.AI" : undefined}
          className={cn(
            "flex items-center rounded-lg py-2 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-hover hover:text-[color:var(--sidebar-strong)]",
            collapsed ? "justify-center px-0" : "gap-3 px-3",
          )}
        >
          <LifeBuoy className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && "Suporte Check.AI"}
        </Link>
        {!collapsed && (
          <div className="px-3 pt-3 text-[11px] leading-relaxed text-sidebar-muted">
            <p>Painel Check.AI · {APP_VERSAO}</p>
            <p>© 2026 Check.AI</p>
          </div>
        )}
      </div>
    </aside>
  );
}
