"use client";

import { useEffect, useState } from "react";
import { Menu, X, LogOut, PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-actions";
import { PAPEL_LABEL, type Profile } from "@/lib/types";
import type { RedeBrand } from "@/lib/auth";
import { UserSwitcher } from "@/components/user-switcher";

const isDev = process.env.NODE_ENV !== "production";

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
  const brandStyle = cor
    ? ({
        ["--primary"]: cor,
        ["--primary-hover"]: `color-mix(in srgb, ${cor} 85%, black)`,
        ["--ring"]: cor,
        ["--sidebar-active"]: cor,
      } as React.CSSProperties)
    : undefined;
  const initials = (profile.nome || profile.email)
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex h-dvh overflow-hidden" style={brandStyle}>
      {/* Sidebar desktop (recolhível) */}
      <div
        className={`hidden shrink-0 overflow-hidden transition-[width] duration-200 lg:block ${
          collapsed ? "w-0" : "w-64"
        }`}
      >
        <Sidebar
          papel={profile.papel}
          brandName={rede?.nome}
          brandLogo={rede?.logo_url}
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
              onNavigate={() => setOpen(false)}
            />
          </div>
        </div>
      )}

      {/* Coluna principal */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
          <div className="flex items-center gap-1">
            {/* Recolher/expandir sidebar (desktop) */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden lg:flex"
              onClick={toggleCollapsed}
              aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
              title={collapsed ? "Expandir menu" : "Recolher menu"}
            >
              {collapsed ? (
                <PanelLeftOpen className="h-5 w-5" />
              ) : (
                <PanelLeftClose className="h-5 w-5" />
              )}
            </Button>
            {/* Menu (mobile) */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label="Menu"
            >
              {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          <div className="flex items-center justify-end gap-2">
            <ThemeToggle />

            <div className="flex items-center gap-3 border-l border-border pl-3">
              <div className="hidden text-right sm:block">
                <p className="text-sm font-medium leading-tight">
                  {profile.nome || profile.email}
                </p>
                <p className="text-xs text-muted-foreground">
                  {PAPEL_LABEL[profile.papel]}
                </p>
              </div>
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {initials}
              </span>
              {isDev && <UserSwitcher currentEmail={profile.email} />}
              <form action={signOut}>
                <Button
                  variant="ghost"
                  size="icon"
                  type="submit"
                  aria-label="Sair"
                  title="Sair"
                >
                  <LogOut className="h-[18px] w-[18px]" />
                </Button>
              </form>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
