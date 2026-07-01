import { ImageResponse } from "next/og";
import { createAdminClient } from "@/lib/supabase/server";

// Favicon da aba (256×256) gerado a partir da logo da rede: a logo ocupa quase
// todo o quadro e o fundo é TRANSPARENTE — sem cartão/moldura cinza. Assim ela
// aparece grande e limpa na aba do navegador. Rota pública (id da rede no
// querystring) para funcionar sem cookies.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("rede");
  let logo: string | null = null;

  if (id) {
    try {
      const admin = createAdminClient();
      const { data } = await admin
        .from("redes")
        .select("favicon_url, logo_url")
        .eq("id", id)
        .maybeSingle();
      const r = data as { favicon_url?: string; logo_url?: string } | null;
      logo = r?.favicon_url || r?.logo_url || null;
    } catch {
      /* fallback abaixo */
    }
  }

  // Sem logo → redireciona para o ícone estático da Check.AI.
  if (!logo) {
    return Response.redirect(new URL("/icon.svg", req.url), 302);
  }

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "transparent",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logo}
          width={244}
          height={244}
          style={{ objectFit: "contain" }}
        />
      </div>
    ),
    { width: 256, height: 256 },
  );
}
