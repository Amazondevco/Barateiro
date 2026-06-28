"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brand } from "@/components/brand";
import { NAV } from "@/lib/nav";
import type { Papel } from "@/lib/types";
import { cn } from "@/lib/utils";

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
          "flex h-16 items-center border-b border-sidebar-border",
          collapsed ? "justify-center px-0" : "px-5",
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
    </aside>
  );
}
