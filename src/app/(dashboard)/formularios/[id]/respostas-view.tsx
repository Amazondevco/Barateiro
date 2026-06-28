"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, THead, TH, TR, TD, EmptyState } from "@/components/ui/table";
import { MultiSelect } from "@/components/ui/multi-select";
import { RefDatePicker } from "./ref-date-picker";
import { cn } from "@/lib/utils";

export type RespostaRow = {
  id: string;
  data_referencia: string;
  status: string;
  total_nao: number;
  unidade_id: string;
  unidade_nome: string;
  usuario_id: string;
  usuario_nome: string;
  departamento_id: string | null;
};

type Unidade = { id: string; nome: string };
type Departamento = { id: string; nome: string; unidade_id: string | null };
type Usuario = { id: string; nome: string; departamento_id: string | null };

function parseISO(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}

type Periodo = "dia" | "semana" | "mes";

export function RespostasView({
  rows,
  unidades,
  departamentos,
  usuarios,
  agruparPorDia,
  periodo,
  refIso,
  prevRef,
  nextRef,
  periodLabel,
}: {
  rows: RespostaRow[];
  unidades: Unidade[];
  departamentos: Departamento[];
  usuarios: Usuario[];
  agruparPorDia: boolean;
  periodo: Periodo;
  refIso: string;
  prevRef: string;
  nextRef: string;
  periodLabel: string;
}) {
  const [busca, setBusca] = useState("");
  const [selUnidades, setSelUnidades] = useState<string[]>([]);
  const [selDeps, setSelDeps] = useState<string[]>([]);
  const [selUsuarios, setSelUsuarios] = useState<string[]>([]);
  const [filtrosAbertos, setFiltrosAbertos] = useState(false);

  const link = (p: Periodo, r?: string) =>
    `?tab=respostas&periodo=${p}${r ? `&ref=${r}` : ""}`;
  const hojeISO = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      "0",
    )}-${String(d.getDate()).padStart(2, "0")}`;
  })();
  const ehHoje = refIso === hojeISO;
  const filtrosAtivos =
    (busca.trim() ? 1 : 0) +
    selUnidades.length +
    selDeps.length +
    selUsuarios.length;

  // Cascata Unidade → Departamento → Usuário
  const depsForUnits = (units: string[]) =>
    units.length
      ? departamentos.filter(
          (d) => d.unidade_id === null || units.includes(d.unidade_id),
        )
      : departamentos;
  const usersFor = (units: string[], deps: string[]) => {
    if (!units.length && !deps.length) return usuarios;
    const eff = deps.length ? deps : depsForUnits(units).map((d) => d.id);
    return usuarios.filter(
      (u) => u.departamento_id && eff.includes(u.departamento_id),
    );
  };
  const depsVisiveis = depsForUnits(selUnidades);
  const usuariosVisiveis = usersFor(selUnidades, selDeps);

  function onUnidades(next: string[]) {
    const vdepIds = new Set(depsForUnits(next).map((d) => d.id));
    const newDeps = selDeps.filter((id) => vdepIds.has(id));
    const vuserIds = new Set(usersFor(next, newDeps).map((u) => u.id));
    setSelUnidades(next);
    setSelDeps(newDeps);
    setSelUsuarios((p) => p.filter((id) => vuserIds.has(id)));
  }
  function onDeps(next: string[]) {
    const vuserIds = new Set(usersFor(selUnidades, next).map((u) => u.id));
    setSelDeps(next);
    setSelUsuarios((p) => p.filter((id) => vuserIds.has(id)));
  }

  const filtered = useMemo(() => {
    const q = busca.trim().toLowerCase();
    return rows.filter((r) => {
      if (
        q &&
        !r.unidade_nome.toLowerCase().includes(q) &&
        !r.usuario_nome.toLowerCase().includes(q)
      )
        return false;
      if (selUnidades.length && !selUnidades.includes(r.unidade_id))
        return false;
      if (
        selDeps.length &&
        !(r.departamento_id && selDeps.includes(r.departamento_id))
      )
        return false;
      if (selUsuarios.length && !selUsuarios.includes(r.usuario_id))
        return false;
      return true;
    });
  }, [rows, busca, selUnidades, selDeps, selUsuarios]);

  // Resumo (reflete os filtros)
  const totalEnvios = filtered.length;
  const totalNao = filtered.reduce((a, r) => a + (r.total_nao ?? 0), 0);
  const comPendencia = filtered.filter((r) => (r.total_nao ?? 0) > 0).length;

  // Agrupa por dia
  const grupos = useMemo(() => {
    const m = new Map<string, RespostaRow[]>();
    for (const r of filtered) {
      const arr = m.get(r.data_referencia);
      if (arr) arr.push(r);
      else m.set(r.data_referencia, [r]);
    }
    return [...m.entries()];
  }, [filtered]);

  return (
    <div className="space-y-4">
      {/* Barra de período + navegação */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="inline-flex rounded-lg border border-border bg-card p-0.5">
            {(
              [
                ["dia", "Dia"],
                ["semana", "Semana"],
                ["mes", "Mês"],
              ] as const
            ).map(([p, l]) => (
              <Link
                key={p}
                href={link(p, refIso)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  periodo === p
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {l}
              </Link>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setFiltrosAbertos((v) => !v)}
            className={cn(
              "flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
              filtrosAbertos || filtrosAtivos > 0
                ? "border-primary/40 bg-primary/10 text-primary"
                : "border-border bg-card text-muted-foreground hover:text-foreground",
            )}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Mais filtros
            {filtrosAtivos > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold text-primary-foreground">
                {filtrosAtivos}
              </span>
            )}
          </button>
        </div>

        <div className="flex items-center gap-1">
          <Link
            href={link(periodo, prevRef)}
            aria-label="Período anterior"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground"
          >
            <ChevronLeft className="h-4 w-4" />
          </Link>
          <span className="min-w-44 text-center text-sm font-medium capitalize">
            {periodLabel}
          </span>
          <Link
            href={link(periodo, nextRef)}
            aria-label="Próximo período"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-card text-muted-foreground hover:text-foreground"
          >
            <ChevronRight className="h-4 w-4" />
          </Link>
          <div className="ml-1">
            <RefDatePicker periodo={periodo} refIso={refIso} />
          </div>
          <Link
            href={link(periodo)}
            title={
              ehHoje
                ? "Você está vendo o dia de hoje"
                : "Voltar para o dia de hoje"
            }
            className={cn(
              "rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors",
              ehHoje
                ? "border-success/40 bg-success-bg text-success"
                : "border-warning/40 bg-warning-bg text-warning hover:opacity-90",
            )}
          >
            Hoje
          </Link>
        </div>
      </div>

      {/* Busca + filtros (expandível) */}
      {filtrosAbertos && (
        <div className="flex flex-wrap items-end gap-3 rounded-xl border border-border bg-muted/30 p-3">
          <div className="w-64">
            <label className="mb-1 block text-xs font-medium text-muted-foreground">
              Buscar
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar por unidade ou gerente…"
                className="h-10 w-full rounded-lg border border-input bg-card pl-9 pr-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
          <Campo label="Unidade">
            <MultiSelect
              emptyLabel="Todas as unidades"
              options={unidades}
              selected={selUnidades}
              onChange={onUnidades}
              emptyHint="Nenhuma unidade."
            />
          </Campo>
          <Campo label="Departamento">
            <MultiSelect
              emptyLabel="Todos os deptos"
              options={depsVisiveis}
              selected={selDeps}
              onChange={onDeps}
              emptyHint="Nenhum departamento."
            />
          </Campo>
          <Campo label="Usuário">
            <MultiSelect
              emptyLabel="Todos os usuários"
              options={usuariosVisiveis}
              selected={selUsuarios}
              onChange={setSelUsuarios}
              emptyHint="Nenhum usuário."
            />
          </Campo>
        </div>
      )}

      {/* Resumo */}
      <div className="grid grid-cols-3 gap-3">
        <StatCard label="Envios" value={totalEnvios} />
        <StatCard
          label="Com pendência"
          value={comPendencia}
          tone={comPendencia > 0 ? "warning" : "default"}
        />
        <StatCard
          label="Não-conformidades"
          value={totalNao}
          tone={totalNao > 0 ? "danger" : "default"}
        />
      </div>

      {totalEnvios === 0 ? (
        <EmptyState
          title="Nenhuma resposta para os filtros"
          description="Ajuste a busca, os filtros ou navegue para outro período."
        />
      ) : (
        <Table>
          <THead>
            <TR>
              <TH>Data</TH>
              <TH>Unidade</TH>
              <TH>Gerente</TH>
              <TH>Não-conformidades</TH>
              <TH>Status</TH>
            </TR>
          </THead>
          <tbody>
            {grupos.map(([dia, linhas]) => (
              <Grupo
                key={dia}
                dia={dia}
                linhas={linhas}
                mostraDia={agruparPorDia}
              />
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  tone = "default",
}: {
  label: string;
  value: number;
  tone?: "default" | "warning" | "danger";
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p
        className={cn(
          "mt-1 text-2xl font-bold",
          tone === "danger" && "text-danger",
          tone === "warning" && "text-warning",
        )}
      >
        {value}
      </p>
    </div>
  );
}

function Grupo({
  dia,
  linhas,
  mostraDia,
}: {
  dia: string;
  linhas: RespostaRow[];
  mostraDia: boolean;
}) {
  return (
    <>
      {mostraDia && (
        <tr className="bg-muted/40">
          <td
            colSpan={5}
            className="px-4 py-1.5 text-xs font-semibold capitalize text-muted-foreground"
          >
            {parseISO(dia).toLocaleDateString("pt-BR", {
              weekday: "long",
              day: "2-digit",
              month: "long",
            })}
          </td>
        </tr>
      )}
      {linhas.map((r) => (
        <TR key={r.id}>
          <TD>{parseISO(r.data_referencia).toLocaleDateString("pt-BR")}</TD>
          <TD>{r.unidade_nome || "—"}</TD>
          <TD>{r.usuario_nome || "—"}</TD>
          <TD>
            {r.total_nao > 0 ? (
              <Badge tone="danger">{r.total_nao}</Badge>
            ) : (
              <Badge tone="success">0</Badge>
            )}
          </TD>
          <TD>
            <Badge tone={r.status === "no_prazo" ? "success" : "warning"}>
              {r.status === "no_prazo" ? "No prazo" : "Fora do prazo"}
            </Badge>
          </TD>
        </TR>
      ))}
    </>
  );
}

function Campo({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-44">
      <label className="mb-1 block text-xs font-medium text-muted-foreground">
        {label}
      </label>
      {children}
    </div>
  );
}
