import { getMinhaRedeMarca } from "@/lib/rede-branding";

// Manifest dinâmico por SESSÃO: o app de cada rede instala com o ícone/nome dela.
// Buscado com use-credentials (cookies) → conseguimos ler a sessão.
export const dynamic = "force-dynamic";

export async function GET() {
  let name = "Check.AI";
  let icone = "/icon-512.svg";
  let type = "image/svg+xml";
  let cor = "#F97316";
  let start = "/";

  try {
    const rede = await getMinhaRedeMarca();
    if (rede) {
      name = rede.nome || name;
      // Ícone gerado (cor da marca + logo) → bonito e uniforme em todas as redes.
      icone = `/api/app-icon?rede=${rede.id}`;
      type = "image/png";
      cor = rede.app_cor || rede.cor_primaria || cor;
      start = "/app";
    }
  } catch {
    /* fallback Check.AI */
  }

  const manifest = {
    name,
    short_name: name.slice(0, 12),
    description: "App da rede.",
    start_url: start,
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    // Fundo do splash = cor da marca (ícone gerado tem o mesmo fundo → blend).
    background_color: cor,
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
