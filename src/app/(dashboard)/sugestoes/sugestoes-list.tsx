"use client";

import { useState } from "react";
import { Lightbulb } from "lucide-react";
import { cn } from "@/lib/utils";
import { SugestaoCard } from "./sugestao-card";

export type SugestaoItem = {
  id: string;
  autor: string;
  texto: string;
  audioUrl: string | null;
  status: string;
  criadoEm: string;
};

type Filtro = "todas" | "novas" | "recebidas";

const ehNova = (s: SugestaoItem) => s.status !== "resolvida";

export function SugestoesList({
  sugestoes,
  podeEscalar,
  emptyDescription,
}: {
  sugestoes: SugestaoItem[];
  podeEscalar: boolean;
  emptyDescription: string;
}) {
  const [filtro, setFiltro] = useState<Filtro>("todas");

  const novas = sugestoes.filter(ehNova).length;
  const recebidas = sugestoes.length - novas;

  const visiveis = sugestoes.filter((s) =>
    filtro === "novas" ? ehNova(s) : filtro === "recebidas" ? !ehNova(s) : true,
  );

  const abas: { v: Filtro; label: string; count: number }[] = [
    { v: "todas", label: "Todas", count: sugestoes.length },
    { v: "novas", label: "Novas", count: novas },
    { v: "recebidas", label: "Recebidas", count: recebidas },
  ];

  return (
    <div className="space-y-4">
      {/* Filtro segmentado */}
      <div className="inline-flex rounded-xl border border-border bg-muted p-1">
        {abas.map((a) => (
          <button
            key={a.v}
            type="button"
            onClick={() => setFiltro(a.v)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
              filtro === a.v
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {a.label}
            <span
              className={cn(
                "rounded-full px-1.5 text-xs tabular-nums",
                filtro === a.v
                  ? "bg-muted text-muted-foreground"
                  : "bg-card/60 text-muted-foreground",
              )}
            >
              {a.count}
            </span>
          </button>
        ))}
      </div>

      {visiveis.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-border bg-card/40 py-14 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Lightbulb className="h-5 w-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">
              {filtro === "todas" ? "Nenhuma sugestão" : "Nada por aqui"}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              {filtro === "todas"
                ? emptyDescription
                : filtro === "novas"
                  ? "Nenhuma sugestão nova no momento."
                  : "Nenhuma sugestão recebida ainda."}
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {visiveis.map((s) => (
            <SugestaoCard
              key={s.id}
              id={s.id}
              autor={s.autor}
              texto={s.texto}
              audioUrl={s.audioUrl}
              status={s.status}
              criadoEm={s.criadoEm}
              podeEscalar={podeEscalar}
            />
          ))}
        </div>
      )}
    </div>
  );
}
