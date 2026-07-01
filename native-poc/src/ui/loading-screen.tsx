import { useEffect, useState } from "react";
import { ClipboardCheck, Clock, Smartphone, type LucideIcon } from "lucide-react";
import checkaiLogo from "../assets/checkai-logo.svg";
import { isBooted } from "../lib/boot-state";

// Logo da rede persistida (ou Check.AI como fallback na 1ª vez).
function redeLogo(): string {
  const l =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("checkai-logo")
      : null;
  return l || checkaiLogo;
}

// `label` é aceito por compatibilidade com os chamadores, mas não é exibido.
export function LoadingScreen(_props: { label?: string }) {
  // Carrossel só na ABERTURA (cold start). Já dentro do app → só a logo pulsando.
  const [carrossel] = useState(() => !isBooted());

  if (!carrossel) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center p-6">
        <div className="checkai-loader-hold flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
          <img
            src={redeLogo()}
            alt=""
            className="h-16 w-16 rounded-2xl object-contain"
          />
        </div>
      </div>
    );
  }

  return <Carrossel />;
}

// Carrossel da marca (abertura): Check.AI → prancheta → relógio → celular →
// logo da rede. Cada quadro pulsa 2× (crossfade); segura na logo da rede.
type Frame = { kind: "img"; src: string } | { kind: "icon"; Icon: LucideIcon };

function buildFrames(): Frame[] {
  return [
    { kind: "img", src: checkaiLogo },
    { kind: "icon", Icon: ClipboardCheck },
    { kind: "icon", Icon: Clock },
    { kind: "icon", Icon: Smartphone },
    { kind: "img", src: redeLogo() },
  ];
}

const FRAME_MS = 1250; // ~2 pulsos (600ms) + respiro

function Carrossel() {
  const [frames] = useState(buildFrames);
  const [i, setI] = useState(0);
  const isLast = i >= frames.length - 1;

  useEffect(() => {
    if (isLast) return; // segura no último quadro (logo da rede) até desmontar
    const t = setTimeout(() => setI((v) => v + 1), FRAME_MS);
    return () => clearTimeout(t);
  }, [i, isLast]);

  const frame = frames[i];

  return (
    <div className="flex min-h-[70vh] items-center justify-center p-6">
      <div
        key={i}
        className={`flex h-24 w-24 items-center justify-center rounded-full bg-primary/10 ${
          isLast ? "checkai-loader-hold" : "checkai-loader"
        }`}
      >
        {frame.kind === "img" ? (
          <img
            src={frame.src}
            alt=""
            className="h-16 w-16 rounded-2xl object-contain"
          />
        ) : (
          <frame.Icon className="h-11 w-11 text-primary" strokeWidth={1.75} />
        )}
      </div>
    </div>
  );
}
