import { getMinhaRedeMarca } from "@/lib/rede-branding";

// Manifest dinâmico por SESSÃO: o app de cada rede instala com o ícone/nome dela.
// Buscado com use-credentials (cookies) → conseguimos ler a sessão.
export const dynamic = "force-dynamic";

export async function GET() {
  let name = "Check.AI";
  let icone = "/icon-512.svg";
  let cor = "#F97316";
  let start = "/";

  try {
    const rede = await getMinhaRedeMarca();
    if (rede) {
      name = rede.nome || name;
      icone = rede.app_icone_url || rede.logo_url || icone;
      cor = rede.app_cor || rede.cor_primaria || cor;
      start = "/app";
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
