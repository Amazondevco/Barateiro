import { createClient } from "@/lib/supabase/server";
import { AppChrome } from "@/components/app-chrome";

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
        .select("redes(cor_primaria)")
        .eq("identidade_id", c.sub)
        .eq("status", "ativo")
        .limit(1)
        .maybeSingle(),
    ]);
    nome = ident?.nome ?? undefined;
    cor = (membro as { redes?: { cor_primaria?: string | null } } | null)?.redes?.cor_primaria ?? null;
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
