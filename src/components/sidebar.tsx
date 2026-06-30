"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings, LifeBuoy, LogOut, ChevronUp } from "lucide-react";
import { Brand } from "@/components/brand";
import { gruposPara } from "@/lib/nav";
import { PAPEL_LABEL, type Papel } from "@/lib/types";
import { signOut } from "@/lib/auth-actions";
import { DEV_EMAILS } from "@/lib/dev-accounts";
import { UserSwitcher } from "@/components/user-switcher";
import { cn } from "@/lib/utils";

export function Sidebar({
  papel,
  brandName,
  brandLogo,
  brandSubtitle,
  collapsed = false,
  onNavigate,
  userName,
  userEmail,
}: {
  papel: Papel;
  brandName?: string;
  brandLogo?: string | null;
  brandSubtitle?: string;
  collapsed?: boolean;
  onNavigate?: () => void;
  userName?: string;
  userEmail?: string;
}) {
  const pathname = usePathname();
  const grupos = gruposPara(papel);
  const podeConfig = papel === "super_admin" || papel === "admin_supermercado";

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function onDown(e: MouseEvent) {
      if (!menuRef.current?.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const nome = userName || userEmail || "Usuário";
  const iniciais = nome
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

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

      <nav className="flex-1 overflow-y-auto p-3">
        {grupos.map((grupo, gi) => (
          <div key={grupo.label} className={cn(gi > 0 && (collapsed ? "mt-2 border-t border-sidebar-border pt-2" : "mt-5"))}>
            {!collapsed && (
              <p className="px-3 pb-1.5 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted">
                {grupo.label}
              </p>
            )}
            <div className="space-y-1">
              {grupo.items.map((item) => {
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
            </div>
          </div>
        ))}
      </nav>

      {/* Rodapé: caixa do usuário + menu (Configurações / Suporte / Sair) */}
      <div className="border-t border-sidebar-border p-3" ref={menuRef}>
        <div className="relative">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            title={collapsed ? nome : undefined}
            className={cn(
              "flex w-full items-center rounded-xl py-2 transition-colors hover:bg-sidebar-hover",
              collapsed ? "justify-center px-0" : "gap-3 px-2",
            )}
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-active text-sm font-semibold text-sidebar-active-foreground">
              {iniciais}
            </span>
            {!collapsed && (
              <>
                <span className="min-w-0 flex-1 text-left">
                  <span className="block truncate text-sm font-semibold text-[color:var(--sidebar-strong)]">
                    {nome}
                  </span>
                  <span className="block truncate text-xs text-sidebar-muted">
                    {PAPEL_LABEL[papel]}
                    {brandName ? ` · ${brandName}` : ""}
                  </span>
                </span>
                <ChevronUp
                  className={cn(
                    "h-4 w-4 shrink-0 text-sidebar-muted transition-transform",
                    menuOpen ? "" : "rotate-180",
                  )}
                />
              </>
            )}
          </button>

          {menuOpen && (
            <div
              className={cn(
                "absolute bottom-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-xl border border-sidebar-border bg-sidebar shadow-xl",
                collapsed ? "left-0 w-48" : "inset-x-0",
              )}
            >
              {podeConfig && (
                <Link
                  href="/configuracoes"
                  onClick={() => {
                    setMenuOpen(false);
                    onNavigate?.();
                  }}
                  className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-hover hover:text-[color:var(--sidebar-strong)]"
                >
                  <Settings className="h-[18px] w-[18px]" /> Configurações
                </Link>
              )}
              <Link
                href="/suporte"
                onClick={() => {
                  setMenuOpen(false);
                  onNavigate?.();
                }}
                className="flex items-center gap-3 px-3 py-2.5 text-sm font-medium text-sidebar-foreground transition-colors hover:bg-sidebar-hover hover:text-[color:var(--sidebar-strong)]"
              >
                <LifeBuoy className="h-[18px] w-[18px]" /> Suporte Check.AI
              </Link>
              {userEmail && DEV_EMAILS.includes(userEmail) && (
                <div className="border-t border-sidebar-border px-3 py-2">
                  <UserSwitcher currentEmail={userEmail} />
                </div>
              )}
              <form action={signOut} className="border-t border-sidebar-border">
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 px-3 py-2.5 text-sm font-medium text-red-400 transition-colors hover:bg-sidebar-hover"
                >
                  <LogOut className="h-[18px] w-[18px]" /> Sair
                </button>
              </form>
            </div>
          )}
        </div>

        {!collapsed && (
          <p className="px-2 pt-3 text-[11px] leading-relaxed text-sidebar-muted">
            Painel Check.AI · v1.0.0
            <br />© 2026 Check.AI
          </p>
        )}
      </div>
    </aside>
  );
}
