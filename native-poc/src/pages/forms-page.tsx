import { useEffect, useMemo, useState } from "react";
import { Clock, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { getQueueItems } from "../lib/queue-store";
import type { QueueRecord } from "../lib/operator-types";
import { syncQueue } from "../lib/sync";
import { Button } from "../ui/button";

const STATUS_SELO: Record<
  QueueRecord["status"],
  { label: string; cls: string }
> = {
  pending: { label: "Aguardando envio", cls: "bg-warning-bg text-warning" },
  synced: { label: "Enviado", cls: "bg-success-bg text-success" },
  error: { label: "Erro", cls: "bg-danger-bg text-danger" },
};

export function FormsPage() {
  const [items, setItems] = useState<QueueRecord[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);

  async function refresh() {
    setItems(await getQueueItems());
  }

  useEffect(() => {
    void refresh();
  }, []);

  const pendingCount = useMemo(
    () => items.filter((item) => item.status !== "synced").length,
    [items],
  );

  async function handleSync() {
    try {
      const result = await syncQueue();
      await refresh();
      setFeedback(
        result.sent > 0
          ? `${result.sent} item(ns) sincronizado(s).`
          : result.online
            ? "Nenhum item pendente para sincronizar."
            : "Sem internet para sincronizar agora.",
      );
    } catch (error) {
      setFeedback(
        error instanceof Error ? error.message : "Falha ao sincronizar.",
      );
    }
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-4 p-4">
      <header className="mt-2">
        <h1 className="text-xl font-semibold">Enviados</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Seus envios e a fila offline.
        </p>
      </header>

      {feedback ? (
        <p className="rounded-lg bg-success-bg px-3 py-2 text-sm text-success">
          {feedback}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Pendentes</p>
          <p className="text-2xl font-semibold">{pendingCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-xs text-muted-foreground">Total local</p>
          <p className="text-2xl font-semibold">{items.length}</p>
        </div>
      </div>

      <div className="flex gap-2">
        <Link
          to="/app/formularios/teste-offline"
          className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary-hover"
        >
          <Send className="h-4 w-4" /> Novo teste offline
        </Link>
        <Button
          variant="outline"
          type="button"
          onClick={() => void handleSync()}
        >
          Sincronizar
        </Button>
      </div>

      <div className="space-y-2">
        {items.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-6 text-center text-sm text-muted-foreground">
            Nenhum formulário salvo localmente.
          </div>
        ) : (
          items.map((item) => {
            const selo = STATUS_SELO[item.status];
            return (
              <article
                key={item.id}
                className="rounded-xl border border-border bg-card p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <strong className="text-sm font-medium">{item.title}</strong>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${selo.cls}`}
                  >
                    {selo.label}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {item.subtitle ?? "Sem subtítulo"}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {item.kind === "form_response"
                    ? `${item.payload.items.length} resposta(s) coletada(s)`
                    : item.payload.notes}
                </p>
                <p className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5" />
                  {new Date(item.createdAt).toLocaleString("pt-BR")}
                </p>
              </article>
            );
          })
        )}
      </div>
    </div>
  );
}
