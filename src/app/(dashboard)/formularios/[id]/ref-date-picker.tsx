"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

const MESES = [
  "Janeiro",
  "Fevereiro",
  "Março",
  "Abril",
  "Maio",
  "Junho",
  "Julho",
  "Agosto",
  "Setembro",
  "Outubro",
  "Novembro",
  "Dezembro",
];
const DIAS_SEMANA = ["S", "T", "Q", "Q", "S", "S", "D"]; // seg→dom

const iso = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate(),
  ).padStart(2, "0")}`;

function parse(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function RefDatePicker({
  periodo,
  refIso,
}: {
  periodo: string;
  refIso: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const selected = parse(refIso);
  const hoje = new Date();

  const [open, setOpen] = useState(false);
  const [view, setView] = useState({
    mes: selected.getMonth(),
    ano: selected.getFullYear(),
  });
  const boxRef = useRef<HTMLDivElement>(null);

  // Fecha ao clicar fora ou apertar Esc
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node))
        setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function go(d: Date) {
    setOpen(false);
    router.push(`${pathname}?tab=respostas&periodo=${periodo}&ref=${iso(d)}`);
  }

  // Grade do mês (segunda como primeiro dia)
  const primeiro = new Date(view.ano, view.mes, 1);
  const offset = (primeiro.getDay() + 6) % 7;
  const diasNoMes = new Date(view.ano, view.mes + 1, 0).getDate();
  const celulas: (number | null)[] = [
    ...Array(offset).fill(null),
    ...Array.from({ length: diasNoMes }, (_, i) => i + 1),
  ];

  const anos = Array.from({ length: 11 }, (_, i) => hoje.getFullYear() - 8 + i);

  const mudaMes = (dir: 1 | -1) =>
    setView((v) => {
      const m = v.mes + dir;
      if (m < 0) return { mes: 11, ano: v.ano - 1 };
      if (m > 11) return { mes: 0, ano: v.ano + 1 };
      return { mes: m, ano: v.ano };
    });

  return (
    <div ref={boxRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium transition-colors hover:text-foreground",
          open ? "text-foreground" : "text-muted-foreground",
        )}
      >
        <CalendarDays className="h-4 w-4" />
        Hoje
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-72 rounded-xl border border-border bg-card p-3 shadow-lg">
          {/* Cabeçalho: mês/ano + navegação */}
          <div className="mb-2 flex items-center gap-2">
            <button
              type="button"
              onClick={() => mudaMes(-1)}
              aria-label="Mês anterior"
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <select
              value={view.mes}
              onChange={(e) =>
                setView((v) => ({ ...v, mes: Number(e.target.value) }))
              }
              className="h-8 flex-1 rounded-md border border-input bg-card px-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              {MESES.map((m, i) => (
                <option key={m} value={i}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={view.ano}
              onChange={(e) =>
                setView((v) => ({ ...v, ano: Number(e.target.value) }))
              }
              className="h-8 w-20 rounded-md border border-input bg-card px-2 text-sm outline-none focus:ring-2 focus:ring-ring"
            >
              {anos.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => mudaMes(1)}
              aria-label="Próximo mês"
              className="flex h-7 w-7 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Cabeçalho dos dias da semana */}
          <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-medium text-muted-foreground">
            {DIAS_SEMANA.map((d, i) => (
              <span key={i}>{d}</span>
            ))}
          </div>

          {/* Grade de dias */}
          <div className="mt-1 grid grid-cols-7 gap-1">
            {celulas.map((dia, i) => {
              if (dia === null) return <span key={i} />;
              const d = new Date(view.ano, view.mes, dia);
              const isSel =
                d.getFullYear() === selected.getFullYear() &&
                d.getMonth() === selected.getMonth() &&
                d.getDate() === selected.getDate();
              const isHoje =
                d.getFullYear() === hoje.getFullYear() &&
                d.getMonth() === hoje.getMonth() &&
                d.getDate() === hoje.getDate();
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => go(d)}
                  className={cn(
                    "flex h-8 items-center justify-center rounded-md text-sm transition-colors",
                    isSel
                      ? "bg-primary font-semibold text-primary-foreground"
                      : isHoje
                        ? "border border-primary text-primary"
                        : "hover:bg-muted",
                  )}
                >
                  {dia}
                </button>
              );
            })}
          </div>

          {/* Atalho: hoje */}
          <button
            type="button"
            onClick={() => go(hoje)}
            className="mt-3 w-full rounded-lg border border-border py-1.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            Ir para hoje
          </button>
        </div>
      )}
    </div>
  );
}
