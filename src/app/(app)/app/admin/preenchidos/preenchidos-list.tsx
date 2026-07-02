"use client";

import { useMemo, useState } from "react";
import { ClipboardCheck, CircleCheck, CircleAlert, ChevronRight } from "lucide-react";
import { RespostaPanel } from "@/app/(dashboard)/formularios/[id]/resposta-panel";

export type PreenchidoRow = {
  id: string;
  checklist: string;
  unidadeId: string | null;
  unidade: string;
  enviadoEm: string;
  totalNao: number;
};

export function PreenchidosList({
  rows,
  unidades,
}: {
  rows: PreenchidoRow[];
  unidades: { id: string; nome: string }[];
}) {
  const [unidade, setUnidade] = useState("");
  const [detalheId, setDetalheId] = useState<string | null>(null);

  const visiveis = useMemo(
    () => (unidade ? rows.filter((r) => r.unidadeId === unidade) : rows),
    [rows, unidade],
  );

  return (
    <div className="space-y-3 p-4">
      {unidades.length > 1 && (
        <select
          value={unidade}
          onChange={(e) => setUnidade(e.target.value)}
          className="h-10 w-full rounded-lg border border-input bg-card px-3 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">Todas as unidades</option>
          {unidades.map((u) => (
            <option key={u.id} value={u.id}>
              {u.nome}
            </option>
          ))}
        </select>
      )}

      {visiveis.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/40 py-14 text-center">
          <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <ClipboardCheck className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="max-w-xs text-sm text-muted-foreground">
            Nenhum checklist preenchido{unidade ? " nesta unidade" : ""} ainda.
          </p>
        </div>
      ) : (
        visiveis.map((r) => {
          const data = new Date(r.enviadoEm).toLocaleString("pt-BR", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });
          const temNao = r.totalNao > 0;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => setDetalheId(r.id)}
              className="flex w-full items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left shadow-sm transition-colors hover:border-primary"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-[15px] font-semibold">{r.checklist}</p>
                <p className="truncate text-[13px] text-muted-foreground">
                  {r.unidade} · {data}
                </p>
              </div>
              <span
                className={`flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                  temNao
                    ? "bg-danger-bg text-danger"
                    : "bg-success-bg text-success"
                }`}
              >
                {temNao ? (
                  <>
                    <CircleAlert className="h-3.5 w-3.5" aria-hidden="true" />
                    {r.totalNao}
                  </>
                ) : (
                  <>
                    <CircleCheck className="h-3.5 w-3.5" aria-hidden="true" /> OK
                  </>
                )}
              </span>
              <ChevronRight
                className="h-5 w-5 shrink-0 text-muted-foreground/60"
                aria-hidden="true"
              />
            </button>
          );
        })
      )}

      {detalheId && (
        <RespostaPanel id={detalheId} onClose={() => setDetalheId(null)} />
      )}
    </div>
  );
}
