"use client";

import {
  Table as TableIcon,
  LayoutGrid,
  Grid3x3,
  Trophy,
  CalendarRange,
  Check,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TH, TR, TD } from "@/components/ui/table";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/lib/utils";
import type { RespostaRow } from "./respostas-view";

export type Visualizacao =
  | "tabela"
  | "cartoes"
  | "matriz"
  | "ranking"
  | "resumo";

export const VISUALIZACOES: {
  id: Visualizacao;
  num: number;
  nome: string;
  desc: string;
  icon: LucideIcon;
}[] = [
  {
    id: "tabela",
    num: 1,
    nome: "Tabela",
    desc: "Lista de envios, agrupada por dia. Visão padrão e detalhada.",
    icon: TableIcon,
  },
  {
    id: "cartoes",
    num: 2,
    nome: "Cartões",
    desc: "Cada envio em um card com conformidade e pendências em destaque.",
    icon: LayoutGrid,
  },
  {
    id: "matriz",
    num: 3,
    nome: "Matriz (unidade × dia)",
    desc: "Linhas = unidades, colunas = dias. Bate o olho no período.",
    icon: Grid3x3,
  },
  {
    id: "ranking",
    num: 4,
    nome: "Ranking de unidades",
    desc: "Quem mais cumpre e quem mais falha no período.",
    icon: Trophy,
  },
  {
    id: "resumo",
    num: 5,
    nome: "Resumo por dia",
    desc: "Uma linha por dia com totais e % de conformidade.",
    icon: CalendarRange,
  },
];

function parseISO(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
const fmtData = (s: string) => parseISO(s).toLocaleDateString("pt-BR");
const fmtDiaLongo = (s: string) =>
  parseISO(s).toLocaleDateString("pt-BR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
  });

function conformidade(itens: number, nao: number): number | null {
  if (!itens) return null;
  return Math.round(((itens - nao) / itens) * 100);
}
function ConfBadge({ pct }: { pct: number | null }) {
  if (pct === null) return <span className="text-muted-foreground">—</span>;
  const tone = pct >= 90 ? "success" : pct >= 70 ? "warning" : "danger";
  return <Badge tone={tone}>{pct}%</Badge>;
}

/* ============ Modal seletor ============ */

export function VisualizacaoModal({
  atual,
  onSelect,
  onClose,
}: {
  atual: Visualizacao;
  onSelect: (v: Visualizacao) => void;
  onClose: () => void;
}) {
  return (
    <Modal title="Como você quer ver as respostas?" onClose={onClose} size="lg">
      <div className="grid gap-3 sm:grid-cols-2">
        {VISUALIZACOES.map((v) => {
          const Icon = v.icon;
          const sel = v.id === atual;
          return (
            <button
              key={v.id}
              type="button"
              onClick={() => {
                onSelect(v.id);
                onClose();
              }}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-3 text-left transition-colors",
                sel
                  ? "border-primary bg-primary/5 ring-1 ring-primary"
                  : "border-border hover:border-primary/50 hover:bg-muted/50",
              )}
            >
              <span
                className={cn(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                  sel
                    ? "bg-primary text-primary-foreground"
                    : "bg-primary/10 text-primary",
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 font-semibold">
                  {v.nome}
                  {sel && <Check className="h-4 w-4 text-primary" />}
                </p>
                <p className="text-xs text-muted-foreground">{v.desc}</p>
              </div>
            </button>
          );
        })}
      </div>
    </Modal>
  );
}

/* ============ Dispatcher ============ */

export function RespostasVisual({
  visual,
  rows,
  agruparPorDia,
  onAbrir,
}: {
  visual: Visualizacao;
  rows: RespostaRow[];
  agruparPorDia: boolean;
  onAbrir?: (id: string) => void;
}) {
  if (visual === "cartoes") return <ViewCartoes rows={rows} onAbrir={onAbrir} />;
  if (visual === "matriz") return <ViewMatriz rows={rows} />;
  if (visual === "ranking") return <ViewRanking rows={rows} />;
  if (visual === "resumo") return <ViewResumo rows={rows} />;
  return <ViewTabela rows={rows} agruparPorDia={agruparPorDia} onAbrir={onAbrir} />;
}

function StatusBadge({ status }: { status: string }) {
  return (
    <Badge tone={status === "no_prazo" ? "success" : "warning"}>
      {status === "no_prazo" ? "No prazo" : "Fora do prazo"}
    </Badge>
  );
}
function NaoBadge({ n }: { n: number }) {
  return n > 0 ? <Badge tone="danger">{n}</Badge> : <Badge tone="success">0</Badge>;
}

/* 1. Tabela (por dia) */
function ViewTabela({
  rows,
  agruparPorDia,
  onAbrir,
}: {
  rows: RespostaRow[];
  agruparPorDia: boolean;
  onAbrir?: (id: string) => void;
}) {
  const grupos = new Map<string, RespostaRow[]>();
  for (const r of rows) {
    const a = grupos.get(r.data_referencia);
    if (a) a.push(r);
    else grupos.set(r.data_referencia, [r]);
  }
  return (
    <Table>
      <THead>
        <TR>
          <TH>Data</TH>
          <TH>Unidade</TH>
          <TH>Gerente</TH>
          <TH>Conformidade</TH>
          <TH>Não-conformidades</TH>
          <TH>Status</TH>
        </TR>
      </THead>
      <tbody>
        {[...grupos.entries()].map(([dia, linhas]) => (
          <ViewTabela.Grupo
            key={dia}
            dia={dia}
            linhas={linhas}
            mostraDia={agruparPorDia}
            onAbrir={onAbrir}
          />
        ))}
      </tbody>
    </Table>
  );
}
ViewTabela.Grupo = function Grupo({
  dia,
  linhas,
  mostraDia,
  onAbrir,
}: {
  dia: string;
  linhas: RespostaRow[];
  mostraDia: boolean;
  onAbrir?: (id: string) => void;
}) {
  return (
    <>
      {mostraDia && (
        <tr className="bg-muted/40">
          <td
            colSpan={6}
            className="px-4 py-1.5 text-xs font-semibold capitalize text-muted-foreground"
          >
            {fmtDiaLongo(dia)}
          </td>
        </tr>
      )}
      {linhas.map((r) => (
        <TR
          key={r.id}
          onClick={() => onAbrir?.(r.id)}
          className={cn(
            "cursor-pointer hover:bg-muted/50",
            !r.lida && "bg-primary/[0.03]",
          )}
        >
          <TD>
            <span className="flex items-center gap-2">
              <span
                className={cn(
                  "h-2 w-2 shrink-0 rounded-full",
                  r.lida ? "bg-transparent" : "bg-primary",
                )}
                aria-label={r.lida ? undefined : "Não lida"}
              />
              <span className={cn(!r.lida && "font-semibold")}>
                {fmtData(r.data_referencia)}
              </span>
            </span>
          </TD>
          <TD className={cn(!r.lida && "font-medium")}>{r.unidade_nome || "—"}</TD>
          <TD>{r.usuario_nome || "—"}</TD>
          <TD>
            <ConfBadge pct={conformidade(r.total_itens, r.total_nao)} />
          </TD>
          <TD>
            <NaoBadge n={r.total_nao} />
          </TD>
          <TD>
            <StatusBadge status={r.status} />
          </TD>
        </TR>
      ))}
    </>
  );
};

/* 2. Cartões */
function ViewCartoes({
  rows,
  onAbrir,
}: {
  rows: RespostaRow[];
  onAbrir?: (id: string) => void;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {rows.map((r) => {
        const pct = conformidade(r.total_itens, r.total_nao);
        return (
          <div
            key={r.id}
            onClick={() => onAbrir?.(r.id)}
            className={cn(
              "cursor-pointer space-y-3 rounded-xl border bg-card p-4 transition-colors hover:border-primary",
              r.lida ? "border-border" : "border-primary/40",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 truncate font-semibold">
                  {!r.lida && (
                    <span
                      className="h-2 w-2 shrink-0 rounded-full bg-primary"
                      aria-label="Não lida"
                    />
                  )}
                  {r.unidade_nome || "—"}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {r.usuario_nome || "—"}
                </p>
              </div>
              <ConfBadge pct={pct} />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {fmtData(r.data_referencia)}
              </span>
              <StatusBadge status={r.status} />
            </div>
            <div
              className={cn(
                "flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium",
                r.total_nao > 0
                  ? "bg-danger-bg text-danger"
                  : "bg-success-bg text-success",
              )}
            >
              <span>Não-conformidades</span>
              <span className="text-lg font-bold">{r.total_nao}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* 3. Matriz unidade × dia */
function ViewMatriz({ rows }: { rows: RespostaRow[] }) {
  const dias = [...new Set(rows.map((r) => r.data_referencia))].sort();
  const unidadesMap = new Map<string, string>();
  for (const r of rows) unidadesMap.set(r.unidade_id, r.unidade_nome || "—");
  const unidades = [...unidadesMap.entries()].sort((a, b) =>
    a[1].localeCompare(b[1]),
  );
  const cell = new Map<string, RespostaRow>();
  for (const r of rows) cell.set(`${r.unidade_id}|${r.data_referencia}`, r);

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="bg-muted/40">
            <th className="sticky left-0 z-10 bg-muted/40 px-3 py-2 text-left font-semibold">
              Unidade
            </th>
            {dias.map((d) => (
              <th
                key={d}
                className="px-2 py-2 text-center text-xs font-semibold capitalize text-muted-foreground"
              >
                {parseISO(d).toLocaleDateString("pt-BR", {
                  day: "2-digit",
                  month: "2-digit",
                })}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {unidades.map(([uid, nome]) => (
            <tr key={uid} className="border-t border-border">
              <td className="sticky left-0 z-10 bg-card px-3 py-2 font-medium">
                {nome}
              </td>
              {dias.map((d) => {
                const r = cell.get(`${uid}|${d}`);
                return (
                  <td key={d} className="px-2 py-2 text-center">
                    {!r ? (
                      <span className="text-muted-foreground/40">·</span>
                    ) : r.total_nao > 0 ? (
                      <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-md bg-danger-bg px-1 text-xs font-bold text-danger">
                        {r.total_nao}
                      </span>
                    ) : (
                      <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-success-bg text-success">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/* 4. Ranking de unidades */
function ViewRanking({ rows }: { rows: RespostaRow[] }) {
  type Agg = {
    nome: string;
    envios: number;
    nao: number;
    itens: number;
    pend: number;
  };
  const m = new Map<string, Agg>();
  for (const r of rows) {
    const a =
      m.get(r.unidade_id) ??
      m
        .set(r.unidade_id, {
          nome: r.unidade_nome || "—",
          envios: 0,
          nao: 0,
          itens: 0,
          pend: 0,
        })
        .get(r.unidade_id)!;
    a.envios++;
    a.nao += r.total_nao;
    a.itens += r.total_itens;
    if (r.total_nao > 0) a.pend++;
  }
  const lista = [...m.values()]
    .map((a) => ({ ...a, pct: conformidade(a.itens, a.nao) }))
    .sort((a, b) => (b.pct ?? -1) - (a.pct ?? -1));

  return (
    <Table>
      <THead>
        <TR>
          <TH>#</TH>
          <TH>Unidade</TH>
          <TH>Envios</TH>
          <TH>Com pendência</TH>
          <TH>Não-conformidades</TH>
          <TH>Conformidade</TH>
        </TR>
      </THead>
      <tbody>
        {lista.map((a, i) => (
          <TR key={a.nome}>
            <TD>
              <span className="font-semibold text-muted-foreground">
                {i + 1}º
              </span>
            </TD>
            <TD className="font-medium">{a.nome}</TD>
            <TD>{a.envios}</TD>
            <TD>
              {a.pend > 0 ? (
                <Badge tone="warning">{a.pend}</Badge>
              ) : (
                <Badge tone="success">0</Badge>
              )}
            </TD>
            <TD>
              <NaoBadge n={a.nao} />
            </TD>
            <TD>
              <ConfBadge pct={a.pct} />
            </TD>
          </TR>
        ))}
      </tbody>
    </Table>
  );
}

/* 5. Resumo por dia */
function ViewResumo({ rows }: { rows: RespostaRow[] }) {
  type Agg = { envios: number; nao: number; itens: number; pend: number };
  const m = new Map<string, Agg>();
  for (const r of rows) {
    const a =
      m.get(r.data_referencia) ??
      m
        .set(r.data_referencia, { envios: 0, nao: 0, itens: 0, pend: 0 })
        .get(r.data_referencia)!;
    a.envios++;
    a.nao += r.total_nao;
    a.itens += r.total_itens;
    if (r.total_nao > 0) a.pend++;
  }
  const dias = [...m.entries()].sort((a, b) => b[0].localeCompare(a[0]));

  return (
    <Table>
      <THead>
        <TR>
          <TH>Dia</TH>
          <TH>Envios</TH>
          <TH>Com pendência</TH>
          <TH>Não-conformidades</TH>
          <TH>Conformidade</TH>
        </TR>
      </THead>
      <tbody>
        {dias.map(([dia, a]) => (
          <TR key={dia}>
            <TD className="capitalize">{fmtDiaLongo(dia)}</TD>
            <TD>{a.envios}</TD>
            <TD>
              {a.pend > 0 ? (
                <Badge tone="warning">{a.pend}</Badge>
              ) : (
                <Badge tone="success">0</Badge>
              )}
            </TD>
            <TD>
              <NaoBadge n={a.nao} />
            </TD>
            <TD>
              <ConfBadge pct={conformidade(a.itens, a.nao)} />
            </TD>
          </TR>
        ))}
      </tbody>
    </Table>
  );
}
