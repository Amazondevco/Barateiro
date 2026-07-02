"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Clock,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
} from "lucide-react";
import { listOutbox, type OutboxSubmission } from "@/lib/offline-db";
import { onOutboxChange } from "@/lib/offline-sync";

export type EnviadoItem = {
  id: string;
  formNome: string;
  data: string;
  unidade: string | null;
  totalNao: number;
};

type Aba = "enviados" | "pendentes";

// Listagem com controle segmentado Enviados / Pendentes.
// Enviados vem do servidor (props); Pendentes = fila local (IndexedDB).
export function FormulariosTabs({ enviados }: { enviados: EnviadoItem[] }) {
  const [aba, setAba] = useState<Aba>("enviados");
  const [pendentes, setPendentes] = useState<OutboxSubmission[]>([]);

  useEffect(() => {
    let vivo = true;
    const refresh = () =>
      listOutbox()
        .then((s) => vivo && setPendentes(s))
        .catch(() => {});
    refresh();
    const off = onOutboxChange(refresh);
    return () => {
      vivo = false;
      off();
    };
  }, []);

  return (
    <div>
      {/* Controle segmentado */}
      <div className="mb-6 flex rounded-xl bg-muted p-1">
        <Segmento
          ativo={aba === "enviados"}
          onClick={() => setAba("enviados")}
          label="Enviados"
          contador={enviados.length}
        />
        <Segmento
          ativo={aba === "pendentes"}
          onClick={() => setAba("pendentes")}
          label="Pendentes"
          contador={pendentes.length}
        />
      </div>

      {aba === "enviados" ? (
        enviados.length === 0 ? (
          <Vazio
            titulo="Nada enviado ainda"
            texto="Os checklists que você enviar aparecem aqui pra conferência."
          />
        ) : (
          <div className="space-y-2.5">
            {enviados.map((r) => (
              <Link
                key={r.id}
                href={`/app/formularios/${r.id}`}
                className="flex items-start gap-3 rounded-xl border border-border bg-card p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary hover:shadow-md"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-success-bg text-success">
                  <CheckCircle2 className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="mb-0.5 truncate text-[13px] font-bold">{r.formNome}</h2>
                  <p className="mb-1.5 truncate text-[12px] font-medium text-muted-foreground">
                    {r.data}
                    {r.unidade ? ` • ${r.unidade}` : ""}
                  </p>
                  {r.totalNao > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-md bg-warning-bg px-1.5 py-0.5 text-[11px] font-medium text-warning">
                      <AlertTriangle className="h-3 w-3" /> {r.totalNao} não-conformidade(s)
                    </span>
                  )}
                </div>
                <ChevronRight className="h-4 w-4 shrink-0 self-center text-muted-foreground/60" />
              </Link>
            ))}
          </div>
        )
      ) : pendentes.length === 0 ? (
        <Vazio
          titulo="Sem pendências"
          texto="Envios feitos offline aparecem aqui até sincronizarem."
        />
      ) : (
        <div className="space-y-2.5">
          {pendentes.map((s) => {
            const d = new Date(s.criadoEm).toLocaleString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            });
            const falhou = !!s.erro && (s.tentativas ?? 0) > 1;
            return (
              <div
                key={s.id}
                className="flex items-start gap-3 rounded-xl border border-warning/40 bg-card p-3 shadow-sm"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-warning-bg text-warning">
                  <Clock className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="mb-0.5 truncate text-[13px] font-bold">{s.formNome}</h2>
                  <p className="truncate text-[12px] font-medium text-muted-foreground">
                    {d} • {falhou ? "tentando reenviar…" : "será enviado ao reconectar"}
                  </p>
                </div>
                {falhou && <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-danger" />}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Segmento({
  ativo,
  onClick,
  label,
  contador,
}: {
  ativo: boolean;
  onClick: () => void;
  label: string;
  contador: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={ativo}
      className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-semibold transition-colors ${
        ativo ? "bg-card text-primary shadow-sm" : "text-muted-foreground"
      }`}
    >
      {label}
      <span
        className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none ${
          ativo ? "bg-primary text-primary-foreground" : "bg-muted-foreground/40 text-card"
        }`}
      >
        {contador}
      </span>
    </button>
  );
}

function Vazio({ titulo, texto }: { titulo: string; texto: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12 text-center">
      <ClipboardCheck className="h-8 w-8 text-muted-foreground" />
      <p className="font-medium">{titulo}</p>
      <p className="max-w-xs text-sm text-muted-foreground">{texto}</p>
    </div>
  );
}
