"use client";

import { useEffect, useState } from "react";
import { Monitor, Sun, Moon } from "lucide-react";

type Pref = "system" | "light" | "dark";

const OPCOES: { v: Pref; label: string; icon: typeof Monitor }[] = [
  { v: "system", label: "Sistema", icon: Monitor },
  { v: "light", label: "Claro", icon: Sun },
  { v: "dark", label: "Escuro", icon: Moon },
];

// Grade de 3 que dirige o mesmo mecanismo de tema do boot
// (`localStorage.theme` + classe `.dark`): ausência da chave = segue o sistema.
export function ThemeGrid() {
  const [pref, setPref] = useState<Pref>("system");

  useEffect(() => {
    try {
      const t = localStorage.getItem("theme");
      setPref(t === "dark" ? "dark" : t === "light" ? "light" : "system");
    } catch {}
  }, []);

  function aplicar(v: Pref) {
    setPref(v);
    try {
      if (v === "system") {
        localStorage.removeItem("theme");
        const sistemaEscuro = matchMedia("(prefers-color-scheme: dark)").matches;
        document.documentElement.classList.toggle("dark", sistemaEscuro);
      } else {
        localStorage.setItem("theme", v);
        document.documentElement.classList.toggle("dark", v === "dark");
      }
    } catch {}
  }

  return (
    <div className="grid grid-cols-3 gap-3">
      {OPCOES.map(({ v, label, icon: Icon }) => {
        const ativo = pref === v;
        return (
          <button
            key={v}
            type="button"
            onClick={() => aplicar(v)}
            aria-pressed={ativo}
            className={`flex flex-col items-center justify-center gap-2 rounded-xl border-2 px-2 py-4 text-[13px] font-semibold transition-colors ${
              ativo
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:bg-muted"
            }`}
          >
            <Icon className="h-6 w-6" />
            {label}
          </button>
        );
      })}
    </div>
  );
}
