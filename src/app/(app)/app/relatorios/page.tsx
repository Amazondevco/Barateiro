"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  CheckCircle2,
  XCircle,
  Clock,
  TrendingUp,
  ChevronDown,
  Check,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";

type Periodo = "hoje" | "semana" | "mes" | "dia";

type RelatorioDia = { data: string; esperados: number; preenchidos: number };
type RelatorioForm = { nome: string; perdidos: number };
type RelatorioData = {
  preenchidos: number;
  perdidos: number;
  pendentesHoje: number;
  esperados: number;
  taxa: number;
  porDia: RelatorioDia[];
  maisPerdidos: RelatorioForm[];
  checklists: { id: string; nome: string }[];
};

type Membro = {
  id: string;
  redeId: string;
  unidadeId: string | null;
  departamentoId: string | null;
  redeNome: string;
  unidadeNome: string | null;
};

function diaLocalISO(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function intervaloDe(periodo: Periodo, dia: string): { inicio: string; fim: string } {
  const hoje = new Date();
  const hojeStr = diaLocalISO(hoje);
  if (periodo === "hoje") return { inicio: hojeStr, fim: hojeStr };
  if (periodo === "dia") return { inicio: dia, fim: dia };
  const dias = periodo === "semana" ? 6 : 29;
  const ini = new Date(hoje);
  ini.setDate(ini.getDate() - dias);
  return { inicio: diaLocalISO(ini), fim: hojeStr };
}

const PERIODOS: { v: Periodo; label: string }[] = [
  { v: "hoje", label: "Hoje" },
  { v: "semana", label: "Semana" },
  { v: "mes", label: "Mês" },
  { v: "dia", label: "Outro dia" },
];

const supabase = createClient();

async function carregarMembros(): Promise<{ userId: string | null; membros: Membro[] }> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { userId: null, membros: [] };
  const { data } = await supabase
    .from("rede_membros")
    .select("id, rede_id, unidade_id, departamento_id, redes(nome), unidades(nome)")
    .eq("identidade_id", user.id)
    .eq("status", "ativo");
  const membros = (data ?? []).map((m) => ({
    id: String(m.id),
    redeId: String(m.rede_id),
    unidadeId: (m.unidade_id as string | null) ?? null,
    departamentoId: (m.departamento_id as string | null) ?? null,
    redeNome:
      typeof m.redes === "object" && m.redes && "nome" in m.redes
        ? String((m.redes as { nome: string }).nome)
        : "Minha rede",
    unidadeNome:
      typeof m.unidades === "object" && m.unidades && "nome" in m.unidades
        ? ((m.unidades as { nome: string | null }).nome ?? null)
        : null,
  }));
  return { userId: user.id, membros };
}

async function computeRelatorio(
  membro: Membro,
  userId: string,
  inicio: string,
  fim: string,
  formId?: string,
): Promise<RelatorioData> {
  const { data: forms } = await supabase
    .from("formularios")
    .select(
      "id, nome, dias_semana, created_at, formulario_unidades(unidade_id), formulario_departamentos(departamento_id)",
    )
    .eq("rede_id", membro.redeId)
    .eq("status", "ativo");

  const aplicaveis = (forms ?? [])
    .filter((f) => {
      const units = (
        (f.formulario_unidades as Array<{ unidade_id: string }> | null) ?? []
      ).map((r) => r.unidade_id);
      if (units.length > 0 && (!membro.unidadeId || !units.includes(membro.unidadeId)))
        return false;
      const deps = (
        (f.formulario_departamentos as Array<{ departamento_id: string }> | null) ?? []
      ).map((r) => r.departamento_id);
      if (deps.length > 0 && (!membro.departamentoId || !deps.includes(membro.departamentoId)))
        return false;
      return true;
    })
    .map((f) => ({
      id: String(f.id),
      nome: String(f.nome),
      weekdays: ((f.dias_semana as number[] | null) ?? []) as number[],
      criadoEm: String(f.created_at).slice(0, 10),
    }));

  const checklists = aplicaveis.map((f) => ({ id: f.id, nome: f.nome }));
  const alvo = formId ? aplicaveis.filter((f) => f.id === formId) : aplicaveis;
  const alvoIds = new Set(alvo.map((f) => f.id));

  const { data: respostas } = await supabase
    .from("respostas")
    .select("formulario_id, data_referencia")
    .eq("usuario_id", userId)
    .gte("data_referencia", inicio)
    .lte("data_referencia", fim);

  const feitos = new Set(
    (respostas ?? []).map((r) => `${r.formulario_id}|${r.data_referencia}`),
  );
  const preenchidos = (respostas ?? []).filter((r) =>
    alvoIds.has(String(r.formulario_id)),
  ).length;

  const hoje = diaLocalISO(new Date());
  const porDia: RelatorioDia[] = [];
  const perdidosPorForm = new Map<string, number>();
  let perdidos = 0;
  let pendentesHoje = 0;
  let esperados = 0;
  let cumpridos = 0;

  const cursor = new Date(`${inicio}T00:00:00`);
  const fimDate = new Date(`${fim}T00:00:00`);
  while (cursor <= fimDate) {
    const dstr = diaLocalISO(cursor);
    if (dstr > hoje) break;
    const weekday = cursor.getDay() || 7;
    let espDia = 0;
    let feitosDia = 0;
    for (const f of alvo) {
      if (dstr < f.criadoEm) continue;
      const esperado = f.weekdays.length === 0 || f.weekdays.includes(weekday);
      if (!esperado) continue;
      espDia++;
      esperados++;
      if (feitos.has(`${f.id}|${dstr}`)) {
        cumpridos++;
        feitosDia++;
      } else if (dstr < hoje) {
        perdidos++;
        perdidosPorForm.set(f.nome, (perdidosPorForm.get(f.nome) ?? 0) + 1);
      } else {
        pendentesHoje++;
      }
    }
    porDia.push({ data: dstr, esperados: espDia, preenchidos: feitosDia });
    cursor.setDate(cursor.getDate() + 1);
  }

  const taxa = esperados > 0 ? Math.round((cumpridos / esperados) * 100) : 100;
  const maisPerdidos = [...perdidosPorForm.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([nome, qtd]) => ({ nome, perdidos: qtd }));

  return {
    preenchidos,
    perdidos,
    pendentesHoje,
    esperados,
    taxa,
    porDia,
    maisPerdidos,
    checklists,
  };
}

export default function RelatoriosPage() {
  const [membros, setMembros] = useState<Membro[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [memberId, setMemberId] = useState<string | null>(null);
  const [periodo, setPeriodo] = useState<Periodo>("hoje");
  const [dia, setDia] = useState<string>(() => diaLocalISO(new Date()));
  const [checklistId, setChecklistId] = useState<string>("");
  const [data, setData] = useState<RelatorioData | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    void carregarMembros().then(({ userId: uid, membros: ms }) => {
      if (!vivo) return;
      setUserId(uid);
      setMembros(ms);
      setMemberId(ms[0]?.id ?? null);
    });
    return () => {
      vivo = false;
    };
  }, []);

  const { inicio, fim } = useMemo(() => intervaloDe(periodo, dia), [periodo, dia]);
  const membro = membros.find((m) => m.id === memberId) ?? null;

  useEffect(() => {
    if (!userId || !membro) return;
    let vivo = true;
    setCarregando(true);
    setErro(null);
    computeRelatorio(membro, userId, inicio, fim, checklistId || undefined)
      .then((r) => vivo && setData(r))
      .catch((e) =>
        vivo && setErro(e instanceof Error ? e.message : "Falha ao carregar."),
      )
      .finally(() => vivo && setCarregando(false));
    return () => {
      vivo = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId, memberId, inicio, fim, checklistId]);

  const incluiHoje = fim >= diaLocalISO(new Date());
  const multiDias = periodo === "semana" || periodo === "mes";
  const checklists = data?.checklists ?? [];

  return (
    <div className="mx-auto w-full max-w-md space-y-4 px-5 py-6">
      <header className="mt-2">
        <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
        <p className="text-sm text-muted-foreground">
          Seu desempenho de preenchimento.
        </p>
      </header>

      {membros.length > 1 ? (
        <SelectPill
          value={memberId ?? ""}
          onChange={setMemberId}
          options={membros.map((m) => ({
            value: m.id,
            label: `${m.redeNome}${m.unidadeNome ? ` · ${m.unidadeNome}` : ""}`,
          }))}
        />
      ) : null}

      {/* Filtros agrupados */}
      <div className="space-y-3 rounded-2xl border border-border bg-card p-3 shadow-sm">
        <div>
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Período
          </p>
          <div className="flex flex-wrap gap-1.5">
            {PERIODOS.map((p) => (
              <button
                key={p.v}
                type="button"
                onClick={() => setPeriodo(p.v)}
                className={`h-9 rounded-full border px-3.5 text-sm font-medium transition-colors ${
                  periodo === p.v
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-background text-muted-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          {periodo === "dia" ? (
            <input
              type="date"
              value={dia}
              max={diaLocalISO(new Date())}
              onChange={(e) => setDia(e.target.value)}
              className="mt-2 w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          ) : null}
        </div>

        <div className="border-t border-border pt-3">
          <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Checklist
          </p>
          <SelectPill
            value={checklistId}
            onChange={setChecklistId}
            options={[
              { value: "", label: "Todos os checklists" },
              ...checklists.map((c) => ({ value: c.id, label: c.nome })),
            ]}
          />
        </div>
      </div>

      {carregando ? (
        <p className="py-16 text-center text-sm text-muted-foreground">
          Carregando relatório…
        </p>
      ) : erro ? (
        <p className="rounded-xl bg-danger-bg px-3 py-2 text-sm text-danger">{erro}</p>
      ) : data ? (
        <>
          <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex items-center gap-4">
              <TaxaRing valor={data.taxa} />
              <div className="min-w-0 flex-1">
                <p className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground">
                  <TrendingUp className="h-4 w-4" /> Taxa de cumprimento
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {data.esperados > 0
                    ? `${data.esperados - data.perdidos - data.pendentesHoje} de ${data.esperados} esperados foram preenchidos.`
                    : "Nenhum checklist esperado no período."}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <MetricCard icon={CheckCircle2} tom="success" valor={data.preenchidos} label="Preenchidos" />
            <MetricCard icon={XCircle} tom="danger" valor={data.perdidos} label="Perdidos" />
            {incluiHoje ? (
              <MetricCard icon={Clock} tom="warning" valor={data.pendentesHoje} label="Pendentes hoje" />
            ) : null}
          </div>

          {multiDias && data.porDia.length > 1 ? (
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <p className="mb-3 text-sm font-semibold">Por dia</p>
              <BarrasPorDia dias={data.porDia} />
              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-primary" /> Preenchidos
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm bg-muted" /> Esperados
                </span>
              </div>
            </div>
          ) : null}

          {data.maisPerdidos.length > 0 ? (
            <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <p className="mb-3 text-sm font-semibold">Checklists mais perdidos</p>
              <div className="space-y-2">
                {data.maisPerdidos.map((f) => (
                  <div key={f.nome} className="flex items-center justify-between gap-3 text-sm">
                    <span className="min-w-0 flex-1 truncate text-muted-foreground">{f.nome}</span>
                    <span className="shrink-0 rounded-lg bg-danger-bg px-2 py-0.5 text-xs font-semibold text-danger">
                      {f.perdidos}×
                    </span>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {data.esperados === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhum checklist esperado neste período.
            </p>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

// Dropdown customizado on-brand (não usa o <select> feio do sistema). Abre via
// portal (não é cortado), item selecionado em destaque na cor da rede.
function SelectPill({
  value,
  onChange,
  options,
  placeholder = "Selecionar",
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
}) {
  const [open, setOpen] = useState(false);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const btnRef = useRef<HTMLButtonElement>(null);
  const atual = options.find((o) => o.value === value);

  function abrir() {
    if (btnRef.current) setRect(btnRef.current.getBoundingClientRect());
    setOpen((v) => !v);
  }

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={abrir}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex h-11 w-full items-center justify-between gap-2 rounded-xl border border-border bg-card px-3.5 text-sm shadow-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <span className="truncate font-medium text-foreground">
          {atual?.label ?? placeholder}
        </span>
        <ChevronDown
          aria-hidden="true"
          className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open &&
        rect &&
        typeof document !== "undefined" &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[60]" onClick={() => setOpen(false)} />
            <div
              role="listbox"
              className="fixed z-[61] max-h-[50vh] overflow-y-auto rounded-2xl border border-border bg-card p-1.5 shadow-xl"
              style={{ top: rect.bottom + 6, left: rect.left, width: rect.width }}
            >
              {options.map((o) => {
                const sel = o.value === value;
                return (
                  <button
                    key={o.value}
                    type="button"
                    role="option"
                    aria-selected={sel}
                    onClick={() => {
                      onChange(o.value);
                      setOpen(false);
                    }}
                    className={`flex w-full items-center justify-between gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors ${
                      sel
                        ? "bg-primary/10 font-semibold text-primary"
                        : "text-foreground hover:bg-muted"
                    }`}
                  >
                    <span className="truncate">{o.label}</span>
                    {sel ? <Check aria-hidden="true" className="h-4 w-4 shrink-0" /> : null}
                  </button>
                );
              })}
            </div>
          </>,
          document.body,
        )}
    </>
  );
}

function MetricCard({
  icon: Icon,
  tom,
  valor,
  label,
}: {
  icon: typeof CheckCircle2;
  tom: "success" | "danger" | "warning";
  valor: number;
  label: string;
}) {
  const cores = {
    success: "bg-success-bg text-success",
    danger: "bg-danger-bg text-danger",
    warning: "bg-warning-bg text-warning",
  }[tom];
  return (
    <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
      <span className={`inline-flex h-9 w-9 items-center justify-center rounded-xl ${cores}`}>
        <Icon className="h-5 w-5" />
      </span>
      <p className="mt-2.5 text-2xl font-bold tabular-nums">{valor}</p>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

function TaxaRing({ valor }: { valor: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const off = c - (Math.min(100, Math.max(0, valor)) / 100) * c;
  const cor =
    valor >= 80
      ? "var(--color-success)"
      : valor >= 50
        ? "var(--color-warning)"
        : "var(--color-danger)";
  return (
    <div className="relative h-16 w-16 shrink-0">
      <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
        <circle cx="32" cy="32" r={r} fill="none" stroke="var(--color-muted)" strokeWidth="7" />
        <circle
          cx="32"
          cy="32"
          r={r}
          fill="none"
          stroke={cor}
          strokeWidth="7"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums">
        {valor}%
      </span>
    </div>
  );
}

// Barras por dia: rola na horizontal quando há muitos dias (ex.: mês). Cada
// coluna tem largura fixa; a trilha ocupa a altura toda e as barras são % dela.
function BarrasPorDia({ dias }: { dias: RelatorioDia[] }) {
  const maxEsp = Math.max(1, ...dias.map((d) => d.esperados));
  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-1">
      <div className="flex items-end gap-1" style={{ height: 116, minWidth: "100%" }}>
        {dias.map((d) => {
          const espH = (d.esperados / maxEsp) * 100;
          const feitoH = (d.preenchidos / maxEsp) * 100;
          const dt = new Date(`${d.data}T00:00:00`);
          return (
            <div
              key={d.data}
              className="flex h-full shrink-0 flex-col items-center justify-end gap-1"
              style={{ width: 18 }}
            >
              <div className="relative w-full flex-1">
                <div
                  className="absolute bottom-0 w-full rounded-t bg-muted"
                  style={{ height: `${espH}%` }}
                />
                <div
                  className="absolute bottom-0 w-full rounded-t bg-primary"
                  style={{ height: `${feitoH}%` }}
                />
              </div>
              <span className="text-[10px] leading-none text-muted-foreground">
                {dt.getDate()}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
