"use client";

import { useEffect, useState } from "react";
import { ClipboardCheck, Clock, Smartphone, type LucideIcon } from "lucide-react";

// Carrossel da marca (igual ao app nativo): Check.AI → prancheta → relógio →
// celular → logo da rede. Cada quadro pulsa 2× (crossfade); segura na logo da
// rede (pulsando) até carregar. Sem texto. Linhas tintadas na cor da rede.
const CHECKAI = "/icon-512.svg";
const FRAME_MS = 1250;

type Frame = { kind: "img"; src: string } | { kind: "icon"; Icon: LucideIcon };

export default function AppLoading() {
  const [redeLogo, setRedeLogo] = useState<string | null>(null);
  const [i, setI] = useState(0);

  // Logo da rede (persistida por BrandPersist). Client-only → sem erro de SSR.
  useEffect(() => {
    try {
      const l = localStorage.getItem("checkai-logo");
      if (l) setRedeLogo(l);
    } catch {
      /* ignora */
    }
  }, []);

  const frames: Frame[] = [
    { kind: "img", src: CHECKAI },
    { kind: "icon", Icon: ClipboardCheck },
    { kind: "icon", Icon: Clock },
    { kind: "icon", Icon: Smartphone },
    { kind: "img", src: redeLogo ?? CHECKAI },
  ];

  const isLast = i >= frames.length - 1;
  useEffect(() => {
    if (isLast) return;
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
          // eslint-disable-next-line @next/next/no-img-element
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
