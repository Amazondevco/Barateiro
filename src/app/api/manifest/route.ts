import { createClient } from "@/lib/supabase/server";

// Manifest dinâmico por SESSÃO: o app de cada rede instala com o ícone/nome dela.
// Buscado com use-credentials (cookies) → conseguimos ler a sessão.
export const dynamic = "force-dynamic";

export async function GET() {
  let name = "Check.AI";
  let icone = "/icon-512.svg";
  let cor = "#F97316";
  let start = "/";

  try {
    const supabase = await createClient();
    const { data: claims } = await supabase.auth.getClaims();
    const sub = (claims?.claims as { sub?: string } | undefined)?.sub;
    if (sub) {
      const { data: membro } = await supabase
        .from("rede_membros")
        .select("redes(nome, app_icone_url, logo_url, app_cor, cor_primaria)")
        .eq("identidade_id", sub)
        .eq("status", "ativo")
        .limit(1)
        .maybeSingle();
      const rede = (membro as {
        redes?: { nome: string; app_icone_url: string | null; logo_url: string | null; app_cor: string | null; cor_primaria: string | null };
      } | null)?.redes;
      if (rede) {
        name = rede.nome;
        icone = rede.app_icone_url || rede.logo_url || icone;
        cor = rede.app_cor || rede.cor_primaria || cor;
        start = "/app";
      }
    }
  } catch {
    /* fallback Check.AI */
  }

  const type = icone.endsWith(".svg") ? "image/svg+xml" : "image/png";
  const manifest = {
    name,
    short_name: name.slice(0, 12),
    description: "App da rede.",
    start_url: start,
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#ffffff",
    theme_color: cor,
    icons: [
      { src: icone, sizes: "512x512", type, purpose: "any" },
      { src: icone, sizes: "512x512", type, purpose: "maskable" },
    ],
  };

  return Response.json(manifest, {
    headers: { "content-type": "application/manifest+json" },
  });
}
