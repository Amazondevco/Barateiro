import type { ReactNode } from "react";

// Logos fictícias (placeholder) — desenhadas como marcas de verdade: lideram
// pela TIPOGRAFIA (como marcas reais), com poucas marcas gráficas refinadas e
// alguns brasões. Monocromáticas (currentColor) p/ um mural "confiam em nós"
// coeso e premium. Trocar por clientes reais quando houver.
const FF = "system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

const LOGOS: ReactNode[] = [
  // ── Varejo / supermercado ────────────────────────────────────
  // Zaffi — wordmark geométrico minúsculo + acento quadrado
  <svg key="zaffi" viewBox="0 0 70 24" className="h-[26px] w-auto">
    <text x="1" y="18.5" fontSize="20" fontWeight={800} letterSpacing="-1.2" fontFamily={FF} fill="currentColor">zaffi</text>
    <rect x="58" y="4.5" width="4.5" height="4.5" rx="1.2" fill="currentColor" />
  </svg>,

  // Mercatto — caixa-alta tracked + fio de base
  <svg key="mercatto" viewBox="0 0 132 24" className="h-[26px] w-auto">
    <text x="1" y="16.5" fontSize="15" fontWeight={600} letterSpacing="2.5" fontFamily={FF} fill="currentColor">MERCATTO</text>
    <rect x="2" y="20.5" width="122" height="1.4" fill="currentColor" />
  </svg>,

  // BonPreço — contraste de peso
  <svg key="bonpreco" viewBox="0 0 118 24" className="h-[26px] w-auto">
    <text x="1" y="18" fontSize="19" letterSpacing="-0.6" fontFamily={FF} fill="currentColor">
      <tspan fontWeight={300}>Bon</tspan><tspan fontWeight={800}>Preço</tspan>
    </text>
  </svg>,

  // Grupo Guará — descritor pequeno + nome forte
  <svg key="guara" viewBox="0 0 96 24" className="h-[26px] w-auto">
    <text x="1.5" y="9" fontSize="7" fontWeight={700} letterSpacing="3" fontFamily={FF} fill="currentColor" opacity="0.75">GRUPO</text>
    <text x="0" y="21" fontSize="16" fontWeight={800} letterSpacing="-0.4" fontFamily={FF} fill="currentColor">Guará</text>
  </svg>,

  // Nova Era — leve/forte com estrela no lugar do espaço
  <svg key="novaera" viewBox="0 0 128 24" className="h-[26px] w-auto">
    <text x="1" y="18" fontSize="18" letterSpacing="-0.3" fontFamily={FF} fill="currentColor">
      <tspan fontWeight={300}>Nova</tspan>
    </text>
    <path d="M60 6 l1.6 3.9 4 .6 -3 2.8 .8 4 -3.4-1.9 -3.4 1.9 .8-4 -3-2.8 4-.6 Z" fill="currentColor" />
    <text x="74" y="18" fontSize="18" fontWeight={800} letterSpacing="-0.3" fontFamily={FF} fill="currentColor">Era</text>
  </svg>,

  // Sondaí — wordmark forte + pingo quadrado
  <svg key="sondai" viewBox="0 0 84 24" className="h-[26px] w-auto">
    <text x="1" y="18" fontSize="19" fontWeight={800} letterSpacing="-0.8" fontFamily={FF} fill="currentColor">Sondaí</text>
    <rect x="72" y="5" width="4" height="4" rx="1" fill="currentColor" />
  </svg>,

  // Vialli — wordmark elegante
  <svg key="vialli" viewBox="0 0 74 24" className="h-[26px] w-auto">
    <text x="1" y="18" fontSize="19" fontWeight={700} letterSpacing="0.5" fontFamily={FF} fill="currentColor">Vialli</text>
  </svg>,

  // Atakão — atacado, robusto e condensado
  <svg key="atakao" viewBox="0 0 108 24" className="h-[26px] w-auto">
    <text x="1" y="18.5" fontSize="20" fontWeight={800} letterSpacing="-0.5" fontFamily={FF} fill="currentColor">ATAKÃO</text>
  </svg>,

  // ── Segurança ────────────────────────────────────────────────
  // Prosevar — escudo minimal + wordmark
  <svg key="prosevar" viewBox="0 0 118 24" className="h-[26px] w-auto">
    <path d="M8 2 L15 4.4 V10 C15 14.5 11.8 16.8 8 18 C4.2 16.8 1 14.5 1 10 V4.4 Z" fill="currentColor" />
    <text x="21" y="17.5" fontSize="16.5" fontWeight={700} letterSpacing="-0.2" fontFamily={FF} fill="currentColor">Prosevar</text>
  </svg>,

  // Vigsul — caixa-alta tight (segurança)
  <svg key="vigsul" viewBox="0 0 92 24" className="h-[26px] w-auto">
    <text x="1" y="18" fontSize="18.5" fontWeight={800} letterSpacing="-0.4" fontFamily={FF} fill="currentColor">VIGSUL</text>
    <rect x="1" y="20.5" width="34" height="1.6" fill="currentColor" />
  </svg>,

  // Protege+ — minúsculo + sinal de mais sobrescrito
  <svg key="protege" viewBox="0 0 106 24" className="h-[26px] w-auto">
    <text x="1" y="18" fontSize="18" fontWeight={600} letterSpacing="-0.4" fontFamily={FF} fill="currentColor">protege</text>
    <text x="86" y="12" fontSize="14" fontWeight={800} fontFamily={FF} fill="currentColor">+</text>
  </svg>,

  // Fortvale — hexágono contornado + wordmark
  <svg key="fortvale" viewBox="0 0 112 24" className="h-[26px] w-auto">
    <path fillRule="evenodd" clipRule="evenodd" d="M8 1.5 L15.5 6 L15.5 15 L8 19.5 L0.5 15 L0.5 6 Z M8 4.4 L3 7.4 L3 13.6 L8 16.6 L13 13.6 L13 7.4 Z" fill="currentColor" />
    <text x="21" y="17.5" fontSize="16.5" fontWeight={700} letterSpacing="-0.2" fontFamily={FF} fill="currentColor">Fortvale</text>
  </svg>,

  // Sentri — brasão (escudo com fenda vertical)
  <svg key="sentri" viewBox="0 0 40 24" className="h-[26px] w-auto">
    <path fillRule="evenodd" clipRule="evenodd" d="M20 1 L31 4.5 V11.5 C31 18 26.5 21.6 20 23.6 C13.5 21.6 9 18 9 11.5 V4.5 Z M18.7 7 L18.7 17.5 L21.3 17.5 L21.3 7 Z" fill="currentColor" />
  </svg>,

  // ── Transporte / logística ───────────────────────────────────
  // Braslog — itálico (velocidade) + barra
  <svg key="braslog" viewBox="0 0 118 24" className="h-[26px] w-auto">
    <g transform="skewX(-11)">
      <text x="8" y="18" fontSize="18.5" fontWeight={800} letterSpacing="-0.6" fontFamily={FF} fill="currentColor">Braslog</text>
    </g>
    <path d="M2 19 L7 5" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
  </svg>,

  // Jamex — wordmark + chevron
  <svg key="jamex" viewBox="0 0 96 24" className="h-[26px] w-auto">
    <text x="1" y="18" fontSize="18.5" fontWeight={800} letterSpacing="-0.5" fontFamily={FF} fill="currentColor">Jamex</text>
    <path d="M82 6 L88 12 L82 18" stroke="currentColor" strokeWidth="3" fill="none" strokeLinejoin="round" strokeLinecap="round" />
  </svg>,

  // Rodovan — wordmark + estrada tracejada
  <svg key="rodovan" viewBox="0 0 116 24" className="h-[26px] w-auto">
    <text x="1" y="16.5" fontSize="17.5" fontWeight={700} letterSpacing="-0.3" fontFamily={FF} fill="currentColor">Rodovan</text>
    <path d="M2 21 H14 M22 21 H34 M42 21 H54 M62 21 H74 M82 21 H94" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" opacity="0.8" />
  </svg>,

  // Translíder — contraste de peso + chevron
  <svg key="translider" viewBox="0 0 132 24" className="h-[26px] w-auto">
    <path d="M2 6 L7 12 L2 18" stroke="currentColor" strokeWidth="3" fill="none" strokeLinejoin="round" strokeLinecap="round" />
    <text x="13" y="18" fontSize="17.5" letterSpacing="-0.4" fontFamily={FF} fill="currentColor">
      <tspan fontWeight={400}>Trans</tspan><tspan fontWeight={800}>líder</tspan>
    </text>
  </svg>,

  // ── Frios / agro ─────────────────────────────────────────────
  // Frigolar — floco (frigorífico) + wordmark
  <svg key="frigolar" viewBox="0 0 116 24" className="h-[26px] w-auto">
    <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M9 2 V16" />
      <path d="M3 5.5 L15 12.5" />
      <path d="M15 5.5 L3 12.5" />
    </g>
    <text x="23" y="16.5" fontSize="16.5" fontWeight={700} letterSpacing="-0.2" fontFamily={FF} fill="currentColor">Frigolar</text>
  </svg>,

  // AgroBem — folha + contraste de peso
  <svg key="agrobem" viewBox="0 0 112 24" className="h-[26px] w-auto">
    <path d="M2 17 C2 8.5 8.5 3 17 3 C17 11.5 10.5 17 2 17 Z" fill="currentColor" />
    <text x="24" y="17.5" fontSize="16.5" letterSpacing="-0.3" fontFamily={FF} fill="currentColor">
      <tspan fontWeight={400}>Agro</tspan><tspan fontWeight={800}>Bem</tspan>
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
          animation: clientsMarquee 58s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .clients-carousel__track { animation: none; }
        }
      `}</style>
      <div className="clients-carousel__track">
        {dobrado.map((logo, i) => (
          <div key={i} className="flex shrink-0 items-center px-7 text-muted-foreground opacity-60">
            {logo}
          </div>
        ))}
      </div>
    </div>
  );
}
