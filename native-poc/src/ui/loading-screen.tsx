import { useEffect, useState } from "react";
import { ClipboardCheck, Clock, Smartphone, type LucideIcon } from "lucide-react";
import checkaiLogo from "../assets/checkai-logo.svg";

// Carrossel da marca: Check.AI → prancheta → relógio → celular → logo da rede.
// Cada quadro pulsa 2× e faz crossfade; segura na logo da rede (pulsando) até
// os dados carregarem (o pai desmonta esta tela quando termina). Sem texto.
type Frame = { kind: "img"; src: string } | { kind: "icon"; Icon: LucideIcon };

function buildFrames(): Frame[] {
  const redeLogo =
    typeof localStorage !== "undefined"
      ? localStorage.getItem("checkai-logo")
      : null;
  return [
    { kind: "img", src: checkaiLogo },
    { kind: "icon", Icon: ClipboardCheck },
    { kind: "icon", Icon: Clock },
    { kind: "icon", Icon: Smartphone },
    // último: logo da rede se já tivermos; senão cai no Check.AI (1ª vez).
    redeLogo ? { kind: "img", src: redeLogo } : { kind: "img", src: checkaiLogo },
  ];
}

const FRAME_MS = 1250; // ~2 pulsos (600ms) + respiro

// `label` é aceito por compatibilidade com os chamadores, mas não é exibido.
export function LoadingScreen(_props: { label?: string }) {
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
