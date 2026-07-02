import type { Computed } from "@/lib/relatorios";

function BarValue({ bars }: { bars: { label: string; value: number }[] }) {
  if (bars.length === 0)
    return <p className="text-sm text-muted-foreground">Sem ocorrências.</p>;
  const max = Math.max(...bars.map((b) => b.value), 1);
  return (
    <div className="space-y-2.5">
      {bars.map((b, i) => (
        <div key={i}>
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <span className="min-w-0 truncate text-[13px]">{b.label}</span>
            <span className="shrink-0 text-[13px] font-semibold tabular-nums">
              {b.value}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${(b.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function BarPct({ bars }: { bars: { label: string; pct: number; n?: number }[] }) {
  if (bars.length === 0)
    return <p className="text-sm text-muted-foreground">Sem dados.</p>;
  return (
    <div className="space-y-2.5">
      {bars.map((b, i) => (
        <div key={i}>
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <span className="min-w-0 truncate text-[13px]">{b.label}</span>
            <span className="shrink-0 text-[13px] font-semibold tabular-nums">
              {b.pct}%{typeof b.n === "number" ? ` · ${b.n}` : ""}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${b.pct}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function Stat({ valor, legenda }: { valor: string; legenda: string }) {
  return (
    <div>
      <p className="text-3xl font-bold tabular-nums text-foreground">{valor}</p>
      <p className="mt-1 text-sm text-muted-foreground">{legenda}</p>
    </div>
  );
}

export function RelatorioCard({
  titulo,
  computed,
}: {
  titulo: string;
  computed: Computed;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <h2 className="mb-3 text-[15px] font-semibold">{titulo}</h2>
      {computed.kind === "vazio" ? (
        <p className="text-sm text-muted-foreground">
          Sem respostas para este recorte.
        </p>
      ) : computed.kind === "conformidade" ? (
        <div>
          <Stat
            valor={`${computed.pct}%`}
            legenda={`${computed.conforme} de ${computed.total} itens conformes · ${computed.nao} não-conf.`}
          />
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-danger-bg">
            <div
              className="h-full rounded-full bg-success"
              style={{ width: `${computed.pct}%` }}
            />
          </div>
        </div>
      ) : computed.kind === "volume" ? (
        <Stat valor={String(computed.total)} legenda="checklists enviados" />
      ) : computed.kind === "media_numerica" ? (
        <Stat
          valor={computed.media.toLocaleString("pt-BR", {
            maximumFractionDigits: 1,
          })}
          legenda={`média · ${computed.titulo} (${computed.n} respostas)`}
        />
      ) : computed.kind === "nao_por_pergunta" ? (
        <BarValue bars={computed.bars} />
      ) : computed.kind === "distribuicao" ? (
        <BarValue bars={computed.bars} />
      ) : computed.kind === "por_unidade" ? (
        <BarPct bars={computed.bars} />
      ) : computed.kind === "evolucao" ? (
        <BarPct bars={computed.points} />
      ) : null}
    </div>
  );
}
