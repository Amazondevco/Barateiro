import { useEffect, useMemo, useState } from "react";
import { Clock, Send } from "lucide-react";
import { Link } from "react-router-dom";
import { getQueueItems } from "../lib/queue-store";
import type { QueueRecord } from "../lib/operator-types";
import { syncQueue } from "../lib/sync";

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
      setFeedback(error instanceof Error ? error.message : "Falha ao sincronizar.");
    }
  }

  return (
    <div className="page">
      <header className="page-header">
        <p className="eyebrow">Formulários</p>
        <h1>Pendentes e enviados</h1>
        <p className="hero-copy">Aqui a SPA já reaproveita a fila offline criada na Fase 0.</p>
      </header>

      {feedback ? <p className="banner success inline-banner">{feedback}</p> : null}

      <section className="card stack-md">
        <div className="stats">
          <div className="stat">
            <span className="summary-label">Pendentes</span>
            <strong>{pendingCount}</strong>
          </div>
          <div className="stat">
            <span className="summary-label">Total local</span>
            <strong>{items.length}</strong>
          </div>
        </div>

        <div className="inline-actions">
          <Link to="/app/formularios/teste-offline" className="primary-button inline-link">
            <Send size={16} />
            Novo teste offline
          </Link>
          <button className="secondary-button" type="button" onClick={() => void handleSync()}>
            Sincronizar fila
          </button>
        </div>

        <div className="stack-sm">
          {items.length === 0 ? (
            <div className="empty-state">Nenhum formulário salvo localmente.</div>
          ) : (
            items.map((item) => (
              <article className="queue-item" key={item.id}>
                <div className="queue-row">
                  <strong>{item.title}</strong>
                  <span className={`pill ${item.status}`}>{item.status}</span>
                </div>
                <p>{item.subtitle ?? "Sem subtítulo"}</p>
                <p className="muted">
                  {item.kind === "form_response"
                    ? `${item.payload.items.length} resposta(s) coletada(s)`
                    : item.payload.notes}
                </p>
                <p className="muted tiny">
                  <Clock size={14} />
                  {new Date(item.createdAt).toLocaleString("pt-BR")}
                </p>
              </article>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
