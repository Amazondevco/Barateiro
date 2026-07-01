import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, Clock, Inbox, ChevronRight } from "lucide-react";
import { getQueueItems } from "../lib/queue-store";
import type { QueueRecord } from "../lib/operator-types";
import { runSync } from "../lib/auto-sync";
import { fetchEnviados, peekEnviados, type Enviado } from "../lib/operator-api";

type Tab = "enviados" | "pendentes";

export function FormsPage() {
  const [tab, setTab] = useState<Tab>("enviados");

  const enviadosInicial = peekEnviados();
  const [enviados, setEnviados] = useState<Enviado[]>(enviadosInicial ?? []);
  const [enviadosLoading, setEnviadosLoading] = useState(enviadosInicial === null);
  const [pendentes, setPendentes] = useState<QueueRecord[]>([]);

  useEffect(() => {
    let mounted = true;

    async function refreshPendentes() {
      const items = await getQueueItems();
      if (mounted) setPendentes(items.filter((i) => i.status !== "synced"));
    }

    function refreshEnviados() {
      fetchEnviados((fresh) => mounted && setEnviados(fresh))
        .then((list) => mounted && setEnviados(list))
        .catch(() => {})
        .finally(() => mounted && setEnviadosLoading(false));
    }

    void refreshPendentes();
    refreshEnviados();
    void runSync(); // garante sincronizar ao abrir

    // Quando o auto-sync esvazia a fila, atualiza as duas listas.
    const onSynced = () => {
      void refreshPendentes();
      refreshEnviados();
    };
    window.addEventListener("checkai:queue-synced", onSynced);
    return () => {
      mounted = false;
      window.removeEventListener("checkai:queue-synced", onSynced);
    };
  }, []);

  return (
    <div className="mx-auto w-full max-w-md space-y-4 p-4">
      <header className="mb-2 mt-2">
        <h1 className="text-2xl font-bold tracking-tight">Checklists</h1>
        <p className="mt-1 text-sm font-medium text-muted-foreground">
          Seus envios e o que ainda está na fila.
        </p>
      </header>

      {/* Controle segmentado */}
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
        {(
          [
            ["enviados", "Enviados", enviados.length],
            ["pendentes", "Pendentes", pendentes.length],
          ] as [Tab, string, number][]
        ).map(([v, label, count]) => {
          const ativo = tab === v;
          return (
            <button
              key={v}
              type="button"
              onClick={() => setTab(v)}
              className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-semibold transition-all ${
                ativo
                  ? "bg-card text-primary shadow-sm"
                  : "text-muted-foreground"
              }`}
            >
              {label}
              {count > 0 ? (
                <span
                  className={`rounded-full px-1.5 text-[10px] font-bold ${
                    ativo
                      ? "bg-primary text-primary-foreground"
                      : "bg-border text-muted-foreground"
                  }`}
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {tab === "enviados" ? (
        <EnviadosList enviados={enviados} loading={enviadosLoading} />
      ) : (
        <PendentesList pendentes={pendentes} />
      )}
    </div>
  );
}

function EnviadosList({
  enviados,
  loading,
}: {
  enviados: Enviado[];
  loading: boolean;
}) {
  if (loading && enviados.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
        Carregando envios…
      </div>
    );
  }
  if (enviados.length === 0) {
    return (
      <EmptyState
        icon={<CheckCircle2 className="h-7 w-7" />}
        title="Nenhum envio ainda"
        subtitle="Os checklists enviados aparecem aqui."
      />
    );
  }
  return (
    <div className="space-y-3">
      {enviados.map((e) => (
        <Link
          key={e.id}
          to={`/app/revisao/enviado/${e.id}`}
          className="flex items-start gap-3.5 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors active:bg-muted/40"
        >
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-success-bg text-success">
            <CheckCircle2 className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <strong className="mb-1 block truncate text-[15px] font-semibold">
              {e.formNome}
            </strong>
            <p className="mb-2 truncate text-[13px] font-medium text-muted-foreground">
              {e.totalItens} item(ns) · ref. {fmtData(e.dataReferencia)}
            </p>
            <p className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
              <Clock className="h-3 w-3" />
              {new Date(e.enviadoEm).toLocaleString("pt-BR")}
            </p>
          </div>
          <ChevronRight className="mt-1 h-5 w-5 shrink-0 self-center text-muted-foreground/60" />
        </Link>
      ))}
    </div>
  );
}

function PendentesList({ pendentes }: { pendentes: QueueRecord[] }) {
  if (pendentes.length === 0) {
    return (
      <EmptyState
        icon={<Inbox className="h-7 w-7" />}
        title="Nada na fila"
        subtitle="Tudo sincronizado. Envios offline aparecem aqui até subirem."
      />
    );
  }
  return (
    <div className="space-y-3">
      {pendentes.map((item) => {
        const erro = item.status === "error";
        return (
          <Link
            key={item.id}
            to={`/app/revisao/pendente/${item.id}`}
            className="flex items-start gap-3.5 rounded-2xl border border-border bg-card p-4 shadow-sm transition-colors active:bg-muted/40"
          >
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${
                erro ? "bg-danger-bg text-danger" : "bg-primary/10 text-primary"
              }`}
            >
              {erro ? (
                <AlertTriangle className="h-6 w-6" />
              ) : (
                <Clock className="h-6 w-6" />
              )}
            </span>
            <div className="min-w-0 flex-1">
              <strong className="mb-1 block truncate text-[15px] font-semibold">
                {item.title}
              </strong>
              <p className="mb-2 truncate text-[13px] font-medium text-muted-foreground">
                {item.kind === "form_response"
                  ? `${item.payload.items.length} resposta(s) coletada(s)`
                  : (item.subtitle ?? "")}
              </p>
              <p className="inline-flex items-center gap-1.5 rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                <Clock className="h-3 w-3" />
                {new Date(item.createdAt).toLocaleString("pt-BR")}
              </p>
            </div>
            <ChevronRight className="mt-1 h-5 w-5 shrink-0 self-center text-muted-foreground/60" />
          </Link>
        );
      })}
    </div>
  );
}

function EmptyState({
  icon,
  title,
  subtitle,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-8 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
        {icon}
      </div>
      <p className="font-medium">{title}</p>
      <p className="max-w-xs text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function fmtData(iso: string) {
  const [y, m, d] = iso.split("-");
  return d && m && y ? `${d}/${m}/${y}` : iso;
}
