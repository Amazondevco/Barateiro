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
import { useAuth } from "../context/auth-context";
import {
  fetchMemberships,
  peekMemberships,
  fetchRelatorio,
  type Membership,
  type RelatorioData,
} from "../lib/operator-api";
import { LoadingScreen } from "../ui/loading-screen";

type Periodo = "hoje" | "semana" | "mes" | "dia";

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

export function ReportsPage() {
  const { user } = useAuth();
  const [memberId, setMemberId] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>(
    () => (peekMemberships() ?? []).filter((m) => m.status === "ativo"),
  );
  const [periodo, setPeriodo] = useState<Periodo>("hoje");
  const [dia, setDia] = useState<string>(() => diaLocalISO(new Date()));
  const [checklistId, setChecklistId] = useState<string>(""); // "" = todos
  const [data, setData] = useState<RelatorioData | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  useEffect(() => {
    let vivo = true;
    void fetchMemberships((fresh) => {
      if (!vivo) return;
      setMemberships(fresh.filter((m) => m.status === "ativo"));
    }).then((list) => {
      if (!vivo) return;
      const ativos = list.filter((m) => m.status === "ativo");
      setMemberships(ativos);
      setMemberId((prev) => prev ?? ativos[0]?.id ?? null);
    });
    return () => {
      vivo = false;
    };
  }, []);

  useEffect(() => {
    if (memberId === null && memberships[0]) setMemberId(memberships[0].id);
  }, [memberships, memberId]);

  const { inicio, fim } = useMemo(() => intervaloDe(periodo, dia), [periodo, dia]);

  useEffect(() => {
    if (!user?.id || !memberId) return;
    let vivo = true;
    setCarregando(true);
    setErro(null);
    fetchRelatorio(memberId, user.id, inicio, fim, checklistId || undefined)
      .then((r) => vivo && setData(r))
      .catch((e) =>
        vivo && setErro(e instanceof Error ? e.message : "Falha ao carregar."),
      )
      .finally(() => vivo && setCarregando(false));
    return () => {
      vivo = false;
    };
  }, [user?.id, memberId, inicio, fim, checklistId]);

  const incluiHoje = fim >= diaLocalISO(new Date());
  const multiDias = periodo === "semana" || periodo === "mes";
  const checklists = data?.checklists ?? [];

  return (
    <div className="mx-auto w-full max-w-md space-y-4 p-4">
      <header className="mt-2">
        <h1 className="text-xl font-semibold">Relatórios</h1>
        <p className="text-sm text-muted-foreground">
          Seu desempenho de preenchimento.
        </p>
      </header>

      {memberships.length > 1 ? (
        <SelectPill
          value={memberId ?? ""}
          onChange={setMemberId}
          options={memberships.map((m) => ({
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
        <div className="py-16">
          <LoadingScreen label="Carregando relatório…" />
        </div>
      ) : erro ? (
        <p className="rounded-xl bg-danger-bg px-3 py-2 text-sm text-danger">
          {erro}
        </p>
      ) : data ? (
        <>
          {/* Taxa de cumprimento */}
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

          {/* Cards de métricas */}
          <div className="grid grid-cols-2 gap-3">
            <MetricCard icon={CheckCircle2} tom="success" valor={data.preenchidos} label="Preenchidos" />
            <MetricCard icon={XCircle} tom="danger" valor={data.perdidos} label="Perdidos" />
            {incluiHoje ? (
              <MetricCard icon={Clock} tom="warning" valor={data.pendentesHoje} label="Pendentes hoje" />
            ) : null}
          </div>

          {/* Gráfico por dia */}
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

          {/* Checklists mais perdidos */}
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
    valor >= 80 ? "var(--color-success)" : valor >= 50 ? "var(--color-warning)" : "var(--color-danger)";
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
function BarrasPorDia({ dias }: { dias: RelatorioData["porDia"] }) {
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
