import type { ReactNode } from "react";

// Logos fictícios (placeholder) desenhados como marcas reais — emblema +
// wordmark, algumas só brasão. Monocromáticas (currentColor) p/ o mural discreto
// no login. Substituir por clientes reais quando houver.
const FF = "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif";

const LOGOS: ReactNode[] = [
  // ── Supermercado ─────────────────────────────────────────────
  // Supernova — estrela + wordmark bi-peso
  <svg key="supernova" viewBox="0 0 156 24" className="h-6 w-auto">
    <path
      d="M11 1.5 L14.4 8.4 L21.8 9.2 L16.2 14 L17.8 21.3 L11 17.6 L4.2 21.3 L5.8 14 L0.2 9.2 L7.6 8.4 Z"
      fill="currentColor"
    />
    <text x="30" y="18" fontSize="17" fontWeight={800} letterSpacing="-0.5" fontFamily={FF} fill="currentColor">
      Super<tspan fontWeight={400}>nova</tspan>
    </text>
  </svg>,

  // Frescatto — folha + wordmark
  <svg key="frescatto" viewBox="0 0 150 24" className="h-6 w-auto">
    <path d="M3 21 C3 10 10 3 21 3 C21 14 14 21 3 21 Z" fill="currentColor" />    <text x="29" y="18" fontSize="17" fontWeight={700} letterSpacing="-0.4" fontFamily={FF} fill="currentColor">
      Frescatto
    </text>
  </svg>,

  // MercaBom — anel + ponto + wordmark bi-peso
  <svg key="mercabom" viewBox="0 0 150 24" className="h-6 w-auto">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M11 1 A10 10 0 1 0 11 21 A10 10 0 1 0 11 1 Z M11 6 A5 5 0 1 1 11 16 A5 5 0 1 1 11 6 Z"
      fill="currentColor"
    />
    <circle cx="11" cy="11" r="2.4" fill="currentColor" />
    <text x="29" y="18" fontSize="17" fontWeight={500} letterSpacing="-0.4" fontFamily={FF} fill="currentColor">
      Merca<tspan fontWeight={800}>Bom</tspan>
    </text>
  </svg>,

  // Rede Prata — losango vazado + wordmark caps
  <svg key="redeprata" viewBox="0 0 150 24" className="h-6 w-auto">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M11 1 L21 11 L11 21 L1 11 Z M11 6 L6 11 L11 16 L16 11 Z"
      fill="currentColor"
    />
    <text x="29" y="18" fontSize="15.5" fontWeight={700} letterSpacing="1.5" fontFamily={FF} fill="currentColor">
      REDE PRATA
    </text>
  </svg>,

  // Hortiva — brasão (folha dentro de círculo)
  <svg key="hortiva" viewBox="0 0 44 24" className="h-6 w-auto">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M22 1 A11 11 0 1 0 22 23 A11 11 0 1 0 22 1 Z M22 3.4 A8.6 8.6 0 1 1 22 20.6 A8.6 8.6 0 1 1 22 3.4 Z"
      fill="currentColor"
    />
    <path d="M17 17 C17 11 20.5 7.5 26.5 7.5 C26.5 13.5 23 17 17 17 Z" fill="currentColor" />
  </svg>,

  // Nutriva — hexágono com cruz + wordmark
  <svg key="nutriva" viewBox="0 0 140 24" className="h-6 w-auto">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M11 1 L20 6 L20 16 L11 21 L2 16 L2 6 Z M9.6 6.5 L9.6 9.6 L6.5 9.6 L6.5 12.4 L9.6 12.4 L9.6 15.5 L12.4 15.5 L12.4 12.4 L15.5 12.4 L15.5 9.6 L12.4 9.6 L12.4 6.5 Z"
      fill="currentColor"
    />
    <text x="29" y="18" fontSize="17" fontWeight={700} letterSpacing="-0.3" fontFamily={FF} fill="currentColor">
      Nutriva
    </text>
  </svg>,

  // ── Segurança ────────────────────────────────────────────────
  // Sentinela — escudo + wordmark
  <svg key="sentinela" viewBox="0 0 150 24" className="h-6 w-auto">
    <path d="M11 1 L20 4 V11 C20 17 16.4 20.4 11 22.5 C5.6 20.4 2 17 2 11 V4 Z" fill="currentColor" />
    <text x="29" y="18" fontSize="17" fontWeight={700} letterSpacing="-0.2" fontFamily={FF} fill="currentColor">
      Sentinela
    </text>
  </svg>,

  // Fortsec — hexágono com F vazado + wordmark caps
  <svg key="fortsec" viewBox="0 0 140 24" className="h-6 w-auto">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M11 1 L20 6 L20 16 L11 21 L2 16 L2 6 Z M8 6.5 L8 15.5 L10.4 15.5 L10.4 12.2 L14 12.2 L14 10.2 L10.4 10.2 L10.4 8.5 L14.6 8.5 L14.6 6.5 Z"
      fill="currentColor"
    />
    <text x="29" y="18" fontSize="15.5" fontWeight={800} letterSpacing="1" fontFamily={FF} fill="currentColor">
      FORTSEC
    </text>
  </svg>,

  // Vígia — olho vazado + wordmark
  <svg key="vigia" viewBox="0 0 140 24" className="h-6 w-auto">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M1 11.5 C4.5 5.5 17.5 5.5 21 11.5 C17.5 17.5 4.5 17.5 1 11.5 Z M11 8 A3.5 3.5 0 1 0 11 15 A3.5 3.5 0 1 0 11 8 Z"
      fill="currentColor"
    />
    <text x="29" y="18" fontSize="17" fontWeight={700} letterSpacing="-0.2" fontFamily={FF} fill="currentColor">
      Vígia<tspan fontWeight={400}> 24h</tspan>
    </text>
  </svg>,

  // Guardião — brasão (escudo com estrela vazada)
  <svg key="guardiao" viewBox="0 0 40 24" className="h-6 w-auto">
    <path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M20 1 L31 4.5 V11.5 C31 18 26.5 21.6 20 23.6 C13.5 21.6 9 18 9 11.5 V4.5 Z M20 7 L21.7 11 L26 11.3 L22.7 14.1 L23.8 18.3 L20 15.9 L16.2 18.3 L17.3 14.1 L14 11.3 L18.3 11 Z"
      fill="currentColor"
    />
  </svg>,

  // ── Transporte ───────────────────────────────────────────────
  // TransVia — chevrons + wordmark
  <svg key="transvia" viewBox="0 0 150 24" className="h-6 w-auto">
    <path d="M3 5 L11 11.5 L3 18 M11 5 L19 11.5 L11 18" stroke="currentColor" strokeWidth="3" fill="none" strokeLinejoin="round" strokeLinecap="round" />
    <text x="30" y="18" fontSize="17" fontWeight={800} letterSpacing="-0.4" fontFamily={FF} fill="currentColor">
      Trans<tspan fontWeight={400}>Via</tspan>
    </text>
  </svg>,

  // RotaCarga — seta/rota + wordmark
  <svg key="rotacarga" viewBox="0 0 155 24" className="h-6 w-auto">
    <path d="M2 12 H17 M12 6.5 L18.5 12 L12 17.5" stroke="currentColor" strokeWidth="3" fill="none" strokeLinejoin="round" strokeLinecap="round" />
    <text x="28" y="18" fontSize="17" fontWeight={700} letterSpacing="-0.4" fontFamily={FF} fill="currentColor">
      Rota<tspan fontWeight={400}>Carga</tspan>
    </text>
  </svg>,

  // Expresslog — brasão (seta rápida / chevrons crescentes)
  <svg key="expresslog" viewBox="0 0 42 24" className="h-6 w-auto">
    <path d="M6 6 L13 12 L6 18 M13 6 L20 12 L13 18 M20 6 L27 12 L20 18" stroke="currentColor" strokeWidth="3" fill="none" strokeLinejoin="round" strokeLinecap="round" />
  </svg>,

  // Fretex — wordmark caps com chevron
  <svg key="fretex" viewBox="0 0 132 24" className="h-6 w-auto">
    <path d="M2 6 L8 12 L2 18" stroke="currentColor" strokeWidth="3" fill="none" strokeLinejoin="round" strokeLinecap="round" />
    <text x="15" y="18" fontSize="17" fontWeight={800} letterSpacing="0.5" fontFamily={FF} fill="currentColor">
      FRETEX
    </text>
  </svg>,
];

// Carrossel minimalista (marquee) das logos, deslizando da esquerda p/ direita.
export function ClientsCarousel() {
  const dobrado = [...LOGOS, ...LOGOS];
  return (
    <div className="clients-carousel" aria-hidden="true">
      <style>{`
        @keyframes clientsMarquee {
          from { transform: translateX(-50%); }
          to   { transform: translateX(0); }
        }
        .clients-carousel {
          overflow: hidden;
          -webkit-mask-image: linear-gradient(to right, transparent, #000 14%, #000 86%, transparent);
          mask-image: linear-gradient(to right, transparent, #000 14%, #000 86%, transparent);
        }
        .clients-carousel__track {
          display: flex;
          align-items: center;
          width: max-content;
          animation: clientsMarquee 50s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .clients-carousel__track { animation: none; }
        }
      `}</style>
      <div className="clients-carousel__track">
        {dobrado.map((logo, i) => (
          <div key={i} className="flex shrink-0 items-center px-7 text-muted-foreground opacity-55">
            {logo}
          </div>
        ))}
      </div>
    </div>
  );
}
