import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { AppChrome } from "@/components/app-chrome";

// iOS usa apple-touch-icon (não o manifest) → ícone da rede por sessão.
export async function generateMetadata(): Promise<Metadata> {
  let apple = "/icon-512.svg";
  try {
    const supabase = await createClient();
    const { data: claims } = await supabase.auth.getClaims();
    const sub = (claims?.claims as { sub?: string } | undefined)?.sub;
    if (sub) {
      const { data: membro } = await supabase
        .from("rede_membros")
        .select("redes(app_icone_url, logo_url)")
        .eq("identidade_id", sub)
        .eq("status", "ativo")
        .limit(1)
        .maybeSingle();
      const rede = (membro as { redes?: { app_icone_url: string | null; logo_url: string | null } } | null)?.redes;
      if (rede) apple = rede.app_icone_url || rede.logo_url || apple;
    }
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
    const [{ data: ident }, { data: membro }] = await Promise.all([
      supabase.from("identidades").select("nome").eq("id", c.sub).maybeSingle(),
      supabase
        .from("rede_membros")
        .select("redes(app_cor, cor_primaria)")
        .eq("identidade_id", c.sub)
        .eq("status", "ativo")
        .limit(1)
        .maybeSingle(),
    ]);
    nome = ident?.nome ?? undefined;
    const rede = (membro as { redes?: { app_cor?: string | null; cor_primaria?: string | null } } | null)?.redes;
    cor = rede?.app_cor || rede?.cor_primaria || null;
  }

  // Cor primária da rede vale para o app todo (barra, botões, banner…)
  const style = cor
    ? ({
        "--primary": cor,
        "--primary-hover": `color-mix(in srgb, ${cor} 85%, black)`,
      } as React.CSSProperties)
    : undefined;

  return (
    <div style={style} className="flex min-h-screen flex-col">
      <AppChrome nome={nome} email={c?.email ?? ""}>
        {children}
      </AppChrome>
    </div>
  );
}
