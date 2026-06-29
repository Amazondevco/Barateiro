import { useEffect, useState } from "react";
import { CheckCircle2, Clock, Inbox } from "lucide-react";
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
      <header className="mt-2">
        <h1 className="text-xl font-semibold">Formulários</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Seus envios e o que ainda está na fila.
        </p>
      </header>

      {/* Abas */}
      <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-card p-1">
        {(
          [
            ["enviados", "Enviados", enviados.length],
            ["pendentes", "Pendentes", pendentes.length],
          ] as [Tab, string, number][]
        ).map(([v, label, count]) => (
          <button
            key={v}
            type="button"
            onClick={() => setTab(v)}
            className={`flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              tab === v
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted"
            }`}
          >
            {label}
            {count > 0 ? (
              <span
                className={`rounded-full px-1.5 text-xs ${
                  tab === v ? "bg-primary/15" : "bg-muted"
                }`}
              >
                {count}
              </span>
            ) : null}
          </button>
        ))}
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
        subtitle="Os formulários enviados aparecem aqui."
      />
    );
  }
  return (
    <div className="space-y-2">
      {enviados.map((e) => (
        <article key={e.id} className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-start justify-between gap-3">
            <strong className="text-sm font-medium">{e.formNome}</strong>
            <span className="shrink-0 rounded-full bg-success-bg px-2 py-0.5 text-xs font-medium text-success">
              Enviado
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {e.totalItens} item(ns) · ref. {fmtData(e.dataReferencia)}
          </p>
          <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3.5 w-3.5" />
            {new Date(e.enviadoEm).toLocaleString("pt-BR")}
          </p>
        </article>
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
    <div className="space-y-2">
      {pendentes.map((item) => {
        const erro = item.status === "error";
        return (
          <article key={item.id} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-start justify-between gap-3">
              <strong className="text-sm font-medium">{item.title}</strong>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                  erro ? "bg-danger-bg text-danger" : "bg-warning-bg text-warning"
                }`}
              >
                {erro ? "Erro — vai tentar de novo" : "Aguardando envio"}
              </span>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {item.kind === "form_response"
                ? `${item.payload.items.length} resposta(s) coletada(s)`
                : (item.subtitle ?? "")}
            </p>
            <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              {new Date(item.createdAt).toLocaleString("pt-BR")}
            </p>
          </article>
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
