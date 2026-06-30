"use client";

import { useEffect, useState } from "react";
import { Menu, X, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { type Profile } from "@/lib/types";
import type { RedeBrand } from "@/lib/auth";
import { SuggestionFab } from "@/components/suggestion-fab";
import { AssistantFab } from "@/components/assistant-fab";
import { PageTitleProvider, TopbarTitle } from "@/components/page-title";
import { TopbarSearch } from "@/components/topbar-search";
import { NotificationBell } from "@/components/notification-bell";
import { ToastProvider } from "@/components/toast";

// true se a cor (hex) for clara → texto escuro fica legível
function isLightHex(hex: string): boolean {
  const m = hex.replace("#", "");
  if (m.length < 6) return false;
  const r = parseInt(m.slice(0, 2), 16);
  const g = parseInt(m.slice(2, 4), 16);
  const b = parseInt(m.slice(4, 6), 16);
  const L = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
  return L > 0.6;
}

export function DashboardShell({
  profile,
  rede,
  children,
}: {
  profile: Profile;
  rede?: RedeBrand | null;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false); // drawer mobile
  const [collapsed, setCollapsed] = useState(false); // sidebar desktop recolhida

  // persiste o estado recolhido
  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem("sidebar-collapsed") === "1");
    } catch {}
  }, []);
  function toggleCollapsed() {
    setCollapsed((v) => {
      const next = !v;
      try {
        localStorage.setItem("sidebar-collapsed", next ? "1" : "0");
      } catch {}
      return next;
    });
  }

  const cor = rede?.cor_primaria;
  const sb = rede?.cor_sidebar;
  const vars: Record<string, string> = {};
  if (cor) {
    vars["--primary"] = cor;
    vars["--primary-hover"] = `color-mix(in srgb, ${cor} 85%, black)`;
    vars["--ring"] = cor;
    vars["--sidebar-active"] = cor;
  }
  if (sb) {
    const light = isLightHex(sb);
    vars["--sidebar"] = sb;
    vars["--sidebar-hover"] = light
      ? `color-mix(in srgb, ${sb} 88%, black)`
      : `color-mix(in srgb, ${sb} 85%, white)`;
    vars["--sidebar-border"] = light
      ? `color-mix(in srgb, ${sb} 82%, black)`
      : `color-mix(in srgb, ${sb} 80%, white)`;
    vars["--sidebar-foreground"] = light ? "#334155" : "#cbd5e1";
    vars["--sidebar-muted"] = light ? "#64748b" : "#94a3b8";
    vars["--sidebar-strong"] = light ? "#0f172a" : "#ffffff";
  }
  const brandStyle = Object.keys(vars).length
    ? (vars as React.CSSProperties)
    : undefined;

  // Topbar usa a mesma cor da sidebar (remapeia os tokens no seu subtree).
  // `color` precisa ser explícito: o texto herda a cor já calculada do body.
  const headerStyle = {
    background: "var(--sidebar)",
    color: "var(--sidebar-strong)",
    ["--foreground"]: "var(--sidebar-strong)",
    ["--muted-foreground"]: "var(--sidebar-muted)",
    ["--muted"]: "var(--sidebar-hover)",
    ["--border"]: "var(--sidebar-border)",
    ["--card"]: "var(--sidebar)",
  } as React.CSSProperties;

  return (
    <PageTitleProvider>
    <ToastProvider>
    <div className="flex h-dvh overflow-hidden" style={brandStyle}>
      {/* Sidebar desktop (recolhível em rail de ícones) */}
      <div className="hidden lg:block">
        <Sidebar
          papel={profile.papel}
          brandName={rede?.nome}
          brandLogo={rede?.logo_url}
          brandSubtitle={
            profile.papel === "super_admin"
              ? "Plataforma de Gestão"
              : "Gestão da Rede"
          }
          collapsed={collapsed}
          userName={profile.nome || profile.email}
          userEmail={profile.email}
        />
      </div>

      {/* Drawer mobile */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full">
            <Sidebar
              papel={profile.papel}
              brandName={rede?.nome}
              brandLogo={rede?.logo_url}
              brandSubtitle={
                profile.papel === "super_admin"
                  ? "Plataforma de Gestão"
                  : "Gestão da Rede"
              }
              onNavigate={() => setOpen(false)}
              userName={profile.nome || profile.email}
              userEmail={profile.email}
            />
          </div>
        </div>
      )}

      {/* Coluna principal */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header
          className="relative z-10 flex h-16 shrink-0 items-center justify-between px-4 shadow-[0_6px_20px_-8px_rgba(2,6,23,0.18)] lg:px-6"
          style={headerStyle}
        >
          <div className="flex min-w-0 flex-1 items-center gap-2">
            {/* Recolher/expandir sidebar (desktop) */}
            <button
              type="button"
              className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-lg text-foreground/70 transition-colors hover:bg-foreground/10 hover:text-foreground lg:flex"
              onClick={toggleCollapsed}
              aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
              title={collapsed ? "Expandir menu" : "Recolher menu"}
            >
              {collapsed ? (
                <PanelLeftOpen className="h-5 w-5" />
              ) : (
                <PanelLeftClose className="h-5 w-5" />
              )}
            </button>
            {/* Menu (mobile) */}
            <button
              type="button"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-foreground/70 transition-colors hover:bg-foreground/10 hover:text-foreground lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="mx-1 hidden h-8 w-px shrink-0 bg-border lg:block" />
            <TopbarTitle />
          </div>

          {/* Identidade/conta agora vivem na caixa do usuário na sidebar. */}
          <div className="flex shrink-0 items-center justify-end gap-2">
            <TopbarSearch />
            <NotificationBell />
            <ThemeToggle />
          </div>
        </header>

        <main className="dash-main flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
      {/* Chat IA (super admin + admin da rede). Sugestão (só admin, acima do chat). */}
      {(profile.papel === "super_admin" || profile.papel === "admin_supermercado") && (
        <AssistantFab papel={profile.papel} />
      )}
      {profile.papel === "admin_supermercado" && <SuggestionFab raised />}
    </div>
    </ToastProvider>
    </PageTitleProvider>
  );
}
