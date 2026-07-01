import {
  ShoppingCart,
  ShoppingBasket,
  Store,
  Tag,
  Leaf,
  Warehouse,
  Shield,
  ShieldCheck,
  Eye,
  Lock,
  Truck,
  Route,
  Package,
  Ship,
  type LucideIcon,
} from "lucide-react";

// Logos fictícios (placeholder) — supermercado, segurança e transporte.
// Substituir por clientes reais quando houver.
const LOGOS: { nome: string; Icon: LucideIcon }[] = [
  { nome: "MercadoBom", Icon: ShoppingCart },
  { nome: "SuperFresco", Icon: ShoppingBasket },
  { nome: "Rede Prata", Icon: Store },
  { nome: "BomPreço", Icon: Tag },
  { nome: "Hortifácil", Icon: Leaf },
  { nome: "MegaMart", Icon: Warehouse },
  { nome: "SegMax", Icon: Shield },
  { nome: "Vigilân", Icon: Eye },
  { nome: "GuardaPro", Icon: ShieldCheck },
  { nome: "Fortaleza", Icon: Lock },
  { nome: "TransVia", Icon: Truck },
  { nome: "RotaCarga", Icon: Route },
  { nome: "ExpressLog", Icon: Package },
  { nome: "MoveFrete", Icon: Ship },
];

// Carrossel minimalista (marquee) de logos, deslizando da esquerda p/ direita.
// Grayscale/sutil (opacidade baixa), com fade nas bordas. Decorativo.
export function ClientsCarousel() {
  const dobrado = [...LOGOS, ...LOGOS]; // duplica p/ loop contínuo
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
          width: max-content;
          animation: clientsMarquee 45s linear infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .clients-carousel__track { animation: none; }
        }
      `}</style>
      <div className="clients-carousel__track">
        {dobrado.map((l, i) => {
          const Icon = l.Icon;
          return (
            <div
              key={i}
              className="flex shrink-0 items-center gap-2 px-6 text-muted-foreground opacity-40"
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={2} />
              <span className="whitespace-nowrap text-sm font-semibold tracking-tight">
                {l.nome}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
