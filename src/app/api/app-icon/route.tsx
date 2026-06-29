import { ImageResponse } from "next/og";
import { getRedeMarcaById } from "@/lib/rede-branding";

// Ícone do app gerado dinamicamente (512×512) para ficar bonito e uniforme
// em TODAS as redes: fundo na cor da marca + logo num cartão branco central.
// Rota pública (id da rede no querystring) → funciona no momento da instalação,
// quando o navegador busca o ícone sem cookies.
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const id = new URL(req.url).searchParams.get("rede");
  // Sem rede → marca Check.AI (verde). Também é o fallback do push.
  let cor = "#15803d";
  let logo: string | null = null;

  if (id) {
    try {
      const marca = await getRedeMarcaById(id);
      if (marca) {
        cor = marca.app_cor || marca.cor_primaria || cor;
        logo = marca.logo_url || marca.app_icone_url || null;
      }
    } catch {
      /* fallback */
    }
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
          background: cor,
        }}
      >
        <div
          style={{
            width: 360,
            height: 360,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#ffffff",
            borderRadius: 84,
            boxShadow: "0 16px 40px rgba(0,0,0,0.18)",
          }}
        >
          {logo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logo}
              width={296}
              height={296}
              style={{ objectFit: "contain" }}
            />
          ) : (
            <div style={{ fontSize: 150, fontWeight: 800, color: cor }}>✓</div>
          )}
        </div>
      </div>
    ),
    { width: 512, height: 512 },
  );
}
