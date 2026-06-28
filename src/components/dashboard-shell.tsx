"use client";

import { useState } from "react";
import { Menu, X, LogOut } from "lucide-react";
import { Sidebar } from "@/components/sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { signOut } from "@/lib/auth-actions";
import { PAPEL_LABEL, type Profile } from "@/lib/types";

export function DashboardShell({
  profile,
  children,
}: {
  profile: Profile;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const initials = (profile.nome || profile.email)
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="flex h-dvh overflow-hidden">
      {/* Sidebar desktop */}
      <div className="hidden lg:block">
        <Sidebar papel={profile.papel} />
      </div>

      {/* Drawer mobile */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full">
            <Sidebar papel={profile.papel} onNavigate={() => setOpen(false)} />
          </div>
        </div>
      )}

      {/* Coluna principal */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <header className="flex h-16 shrink-0 items-center justify-between border-b border-border bg-card px-4 lg:px-6">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>

          <div className="flex flex-1 items-center justify-end gap-2">
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
