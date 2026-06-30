"use client";

import { usePathname } from "next/navigation";
import { AppBottomNav } from "@/components/app-bottom-nav";
import { SuggestionFab } from "@/components/suggestion-fab";
import { UserSwitcher } from "@/components/user-switcher";
import { DEV_EMAILS } from "@/lib/dev-accounts";

// Sem topo e sem hambúrguer — só conteúdo + barra inferior.
// Some nas telas "cheias" (preencher/assinar formulário).
export function AppChrome({
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

  return (
    // Safe areas (edge-to-edge): empurra o conteúdo para baixo da barra de status
    // e reserva o espaço da barra de navegação do sistema na base.
    <div
      className="flex min-h-screen flex-col"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <main
        className="flex flex-1 flex-col"
        style={{ paddingBottom: "calc(110px + env(safe-area-inset-bottom))" }}
      >
        {children}
      </main>

      {/* Troca de usuário: só para contas de DEV (teste). Discreto. */}
      {DEV_EMAILS.includes(email) && (
        <div className="fixed right-2 top-2 z-40">
          <UserSwitcher currentEmail={email} />
        </div>
      )}

      <AppBottomNav />
      <SuggestionFab raised />
    </div>
  );
}
