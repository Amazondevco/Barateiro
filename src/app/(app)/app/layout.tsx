import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { AppChrome } from "@/components/app-chrome";
import { OfflineSyncProvider } from "@/components/offline-sync-provider";
import { getMinhaRedeMarca } from "@/lib/rede-branding";

// iOS usa apple-touch-icon (não o manifest) → ícone da rede por sessão.
export async function generateMetadata(): Promise<Metadata> {
  let apple = "/icon-512.svg";
  try {
    const rede = await getMinhaRedeMarca();
    if (rede) apple = `/api/app-icon?rede=${rede.id}`;
  } catch {
    /* fallback */
  }
  return { icons: { apple } };
}

export default async function AppLoggedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: claims } = await supabase.auth.getClaims();
  const c = claims?.claims as { sub?: string; email?: string } | undefined;

  let nome: string | undefined;
  let cor: string | null = null;
  if (c?.sub) {
    const [{ data: ident }, marca] = await Promise.all([
      supabase.from("identidades").select("nome").eq("id", c.sub).maybeSingle(),
      getMinhaRedeMarca(),
    ]);
    nome = ident?.nome ?? undefined;
    cor = marca?.app_cor || marca?.cor_primaria || null;
  }

  // Cor primária da rede vale para o app todo (barra, botões, banner…)
  const style = cor
    ? ({
        "--primary": cor,
        "--primary-hover": `color-mix(in srgb, ${cor} 85%, black)`,
      } as React.CSSProperties)
    : undefined;

  return (
    <div style={style} className="app-shell flex min-h-screen flex-col">
      <OfflineSyncProvider />
      <AppChrome nome={nome} email={c?.email ?? ""}>
        {children}
      </AppChrome>
    </div>
  );
}
