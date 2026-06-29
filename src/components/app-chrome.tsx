"use client";

import { usePathname } from "next/navigation";
import { AppDrawer } from "@/components/app-drawer";
import { AppBottomNav } from "@/components/app-bottom-nav";
import { SuggestionFab } from "@/components/suggestion-fab";
import { UserSwitcher } from "@/components/user-switcher";
import { DEV_EMAILS } from "@/lib/dev-accounts";

// Topo (hambúrguer + logo) + barra inferior. Some nas telas "cheias"
// (preencher/assinar formulário) pra não atrapalhar.
export function AppChrome({
  nome,
  email = "",
  children,
}: {
  nome?: string;
  email?: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const telaCheia = /\/form\/|\/assinar$/.test(pathname);
  if (telaCheia) return <>{children}</>;

  // A tela Início (/app/rede) tem banner próprio (logo da rede) → sem topo padrão.
  const semTopo = pathname.startsWith("/app/rede");

  return (
    <div className="flex min-h-screen flex-col">
      {!semTopo && (
        <header className="sticky top-0 z-30 flex items-center gap-2 border-b border-border bg-card px-3 py-2.5">
          <AppDrawer nome={nome} />
          <div className="flex flex-1 items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/amazondevco-logo.png" alt="" className="h-7 w-7 object-contain" />
            <span className="font-semibold">Check.AI</span>
          </div>
          {DEV_EMAILS.includes(email) && <UserSwitcher currentEmail={email} />}
        </header>
      )}

      <main className="flex flex-1 flex-col">{children}</main>

      <AppBottomNav />
      <SuggestionFab raised />
    </div>
  );
}
